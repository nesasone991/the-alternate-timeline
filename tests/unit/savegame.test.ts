import { describe, expect, it } from 'vitest';
import { romeAlternateScenario as rome } from '../../src/data/scenarios/rome/alternate';
import { romeActualTimeline } from '../../src/data/scenarios/rome/history';
import { replay } from '../../src/features/simulation/engine';
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
      scenarioVersion: 2,
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
    for (const path of [[], ['provincial-revenue'], ['pay-the-armies', 'settle-federates'], ['reform-taxation', 'field-army']]) {
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
    expect(parseSave(rome, saveWith({ scenarioId: 'napoleon' })).status).toBe('incompatible');
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
