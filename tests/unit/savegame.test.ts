import { describe, expect, it } from 'vitest';
import { romeAlternateScenario as rome } from '../../src/data/scenarios/rome/alternate';
import { romeActualTimeline } from '../../src/data/scenarios/rome/history';
import { enumeratePaths, replay } from '../../src/features/simulation/engine';
import { SAVE_FORMAT, parseSave, saveKey, serializeSave } from '../../src/features/simulation/savegame';

const NOW = new Date('2026-10-15T20:00:00.000Z');

function saveWith(overrides: Record<string, unknown>): string {
  return JSON.stringify({
    format: SAVE_FORMAT,
    formatVersion: 1,
    scenarioId: rome.id,
    scenarioVersion: rome.version,
    savedAt: NOW.toISOString(),
    choices: ['reform-taxation'],
    ...overrides,
  });
}

describe('serializeSave', () => {
  it('stores only versions and the list of choices — no resources or flags', () => {
    const state = replay(rome, ['reform-taxation', 'hold-italy']);
    const file = JSON.parse(serializeSave(rome, state, NOW)) as Record<string, unknown>;
    expect(file).toEqual({
      format: SAVE_FORMAT,
      formatVersion: 1,
      scenarioId: 'rome-alternate',
      scenarioVersion: 5,
      savedAt: '2026-10-15T20:00:00.000Z',
      choices: ['reform-taxation', 'hold-italy'],
    });
  });

  it('uses a per-campaign storage key', () => {
    expect(saveKey('rome-alternate')).toBe('tat.save.rome-alternate');
  });
});

describe('parseSave', () => {
  it('round-trips every reachable path to an identical state', () => {
    for (const path of [
      [],
      ['provincial-revenue'],
      ['pay-the-armies', 'settle-federates'],
      ['reform-taxation', 'field-army'],
      ...enumeratePaths(rome),
    ]) {
      const state = replay(rome, path);
      const loaded = parseSave(rome, serializeSave(rome, state, NOW));
      expect(loaded.status).toBe('restored');
      if (loaded.status === 'restored') {
        expect(JSON.stringify(loaded.state)).toBe(JSON.stringify(state));
        expect(loaded.savedAt).toBe(NOW.toISOString());
      }
    }
  });

  it('reports an empty slot', () => {
    expect(parseSave(rome, null)).toEqual({ status: 'empty' });
    expect(parseSave(rome, '')).toEqual({ status: 'empty' });
  });

  it('treats damaged or foreign data as corrupt', () => {
    for (const raw of ['{not json', '[]', '"text"', 'null', JSON.stringify({ hello: 'world' }), 'x'.repeat(20000)]) {
      expect(parseSave(rome, raw).status).toBe('corrupt');
    }
  });

  it('rejects saves from other versions or campaigns as incompatible, with a reason', () => {
    const older = parseSave(rome, saveWith({ scenarioVersion: 1 }));
    expect(older.status).toBe('incompatible');
    if (older.status === 'incompatible') expect(older.reason).toMatch(/earlier version of this campaign/);
    expect(parseSave(rome, saveWith({ formatVersion: 99 })).status).toBe('incompatible');
    expect(parseSave(rome, saveWith({ scenarioVersion: 2 })).status).toBe('incompatible');
    expect(parseSave(rome, saveWith({ scenarioId: 'napoleon' })).status).toBe('incompatible');
  });

  it('explains why a version 4 save (Decisions 1–4, ending at the old checkpoint) cannot be loaded', () => {
    // A real version 4 save: the same choice ids exist, but in version 4 the game
    // stopped at a checkpoint after Decision 4, nothing due in 475 had happened,
    // and an unpaid cost simply vanished at 0. Replaying it now would silently
    // land somewhere else with different numbers, so it is refused.
    const v4 = parseSave(
      rome,
      saveWith({ scenarioVersion: 4, choices: ['provincial-revenue', 'field-army', 'join-expedition', 'bargain-with-regions'] }),
    );
    expect(v4.status).toBe('incompatible');
    if (v4.status !== 'incompatible') return;
    expect(v4.reason).toContain('earlier version of this campaign (version 4; this is version 5)');
    expect(v4.reason).toContain('cannot be replayed exactly');
    expect(v4.reason).toContain('Version 5: Decision 5, the final crisis, and the three endings');
    expect(v4.reason).not.toContain('Version 4:');
  });

  it('lists every change since an older save', () => {
    const v2 = parseSave(rome, saveWith({ scenarioVersion: 2, choices: ['reform-taxation', 'field-army'] }));
    if (v2.status !== 'incompatible') throw new Error('expected incompatible');
    expect(v2.reason).toContain('(version 2; this is version 5)');
    expect(v2.reason).toMatch(/Version 3: Decision 3.*Version 4: Decision 4.*Version 5: Decision 5/);
  });

  it('explains newer and unlabelled saves differently', () => {
    const newer = parseSave(rome, saveWith({ scenarioVersion: 9 }));
    if (newer.status === 'incompatible') expect(newer.reason).toMatch(/newer than this site's version 5/);
    else throw new Error('expected incompatible');
    const unlabelled = parseSave(rome, saveWith({ scenarioVersion: '3' }));
    if (unlabelled.status === 'incompatible') expect(unlabelled.reason).toMatch(/does not say which version/);
    else throw new Error('expected incompatible');
  });

  it('rejects blocked decision 3 and decision 4 combinations', () => {
    expect(parseSave(rome, saveWith({ choices: ['reform-taxation', 'hold-italy', 'join-expedition'] })).status).toBe('corrupt');
    expect(
      parseSave(rome, saveWith({ choices: ['provincial-revenue', 'field-army', 'join-expedition', 'restore-imperial-authority'] }))
        .status,
    ).toBe('corrupt');
  });

  it('restores a decision 4 save exactly, at decision 5', () => {
    const path = ['provincial-revenue', 'field-army', 'join-expedition', 'bargain-with-regions'];
    const loaded = parseSave(rome, saveWith({ choices: path }));
    if (loaded.status !== 'restored') throw new Error('expected restored');
    expect(loaded.state.currentEventId).toBe('d5-final-crisis');
    expect(loaded.state.resources).toEqual({ economy: 4, military: 52, unity: 53, legitimacy: 37 });
    expect(loaded.state.records[3]!.narrative!.situation).toMatch(/treasury is all but empty/);
    expect(JSON.stringify(loaded.state)).toBe(JSON.stringify(replay(rome, path)));
  });

  it('restores a finished campaign with its ending, unpaid costs and long-term consequences', () => {
    const path = ['provincial-revenue', 'field-army', 'join-expedition', 'bargain-with-regions', 'defend-imperial-office'];
    const loaded = parseSave(rome, saveWith({ choices: path }));
    if (loaded.status !== 'restored') throw new Error('expected restored');
    expect(loaded.state.currentEventId).toBe('settlement-476');
    expect(loaded.state.endingId).toBe('fragmented-survival');
    expect(loaded.state.flags).toContain('treasury-defaulted');
    expect(loaded.state.pending.map((p) => p.consequenceId)).toEqual(['usurper-threat']);
    expect(JSON.stringify(loaded.state)).toBe(JSON.stringify(replay(rome, path)));
  });

  it('rejects a save that continues past the ending', () => {
    const path = ['provincial-revenue', 'field-army', 'join-expedition', 'bargain-with-regions', 'defend-imperial-office', 'defend-imperial-office'];
    expect(parseSave(rome, saveWith({ choices: path })).status).toBe('corrupt');
  });

  it('rejects malformed or invalid choice lists', () => {
    expect(parseSave(rome, saveWith({ choices: 'reform-taxation' })).status).toBe('corrupt');
    expect(parseSave(rome, saveWith({ choices: [42] })).status).toBe('corrupt');
    expect(parseSave(rome, saveWith({ choices: ['<script>'] })).status).toBe('corrupt');
    expect(parseSave(rome, saveWith({ choices: Array(40).fill('reform-taxation') })).status).toBe('corrupt');
    // Well-formed ids that the rules do not allow in this order:
    const invalid = parseSave(rome, saveWith({ choices: ['hold-italy'] }));
    expect(invalid.status).toBe('corrupt');
    if (invalid.status === 'corrupt') expect(invalid.reason).toMatch(/not valid in this campaign/);
    // A blocked combination (paying the armies leaves too little money for a field army):
    expect(parseSave(rome, saveWith({ choices: ['pay-the-armies', 'field-army'] })).status).toBe('corrupt');
  });

  it('cannot be used to inject resources or flags: only replayed choices count', () => {
    const tampered = saveWith({
      choices: ['provincial-revenue'],
      resources: { economy: 100, military: 100, unity: 100, legitimacy: 100 },
      flags: ['field-army'],
    });
    const loaded = parseSave(rome, tampered);
    expect(loaded.status).toBe('restored');
    if (loaded.status === 'restored') {
      expect(loaded.state.resources).toEqual({ economy: 32, military: 45, unity: 45, legitimacy: 27 });
      expect(loaded.state.flags).toEqual(['provincial-revenue']);
    }
  });

  it('ignores prototype-pollution keys', () => {
    const loaded = parseSave(rome, '{"__proto__":{"polluted":true},' + saveWith({}).slice(1));
    expect(loaded.status).toBe('restored');
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('tolerates a missing or invalid timestamp', () => {
    const loaded = parseSave(rome, saveWith({ savedAt: 'yesterday' }));
    expect(loaded.status).toBe('restored');
    if (loaded.status === 'restored') expect(loaded.savedAt).toBe('');
  });

  it('never touches actual history', () => {
    const before = JSON.stringify(romeActualTimeline);
    parseSave(rome, saveWith({ choices: ['reform-taxation', 'hold-italy'] }));
    expect(JSON.stringify(romeActualTimeline)).toBe(before);
  });
});
