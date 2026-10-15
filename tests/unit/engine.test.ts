import { describe, expect, it } from 'vitest';
import {
  applyChoice,
  checkRequirement,
  clampResource,
  consequencesResolvedAt,
  createInitialState,
  enumeratePaths,
  evaluateChoices,
  getCurrentNode,
  replay,
  totalPerResource,
} from '../../src/features/simulation/engine';
import { validateScenario } from '../../src/features/simulation/validateScenario';
import { deepFreeze } from '../../src/lib/freeze';
import type { AlternateScenario, SimulationState } from '../../src/types/simulation';

/**
 * Generic engine behaviour on a small fixture: clamping, prerequisites,
 * conditional effects, scheduled consequences (applied and lapsed), endings,
 * determinism and immutability. Rome content is tested in rome-campaign.test.ts.
 */
const fixture: AlternateScenario = deepFreeze<AlternateScenario>({
  id: 'fixture',
  version: 1,
  campaignId: 'fixture',
  title: 'Fixture',
  disclaimer: 'Test data.',
  initialResources: { economy: 95, military: 5, unity: 50, legitimacy: 50 },
  startNodeId: 'a',
  plannedDecisionCount: 2,
  flags: [
    { id: 'chose-boom', label: 'Boom', laterEffect: 'Unlocks follow-up.' },
    { id: 'chose-bust', label: 'Bust', laterEffect: 'Blocks follow-up.' },
  ],
  nodes: [
    {
      kind: 'decision',
      id: 'a',
      year: 400,
      yearApproximate: false,
      title: 'First',
      context: 'c',
      historicalContextIds: [],
      prompt: 'p',
      choices: [
        {
          id: 'boom',
          label: 'Boom',
          rationale: 'r',
          outcome: 'o',
          effects: [
            { resource: 'economy', delta: 20 },
            { resource: 'military', delta: -20 },
          ],
          consequences: [
            {
              id: 'boom-dividend',
              dueYear: 410,
              hint: 'Something good may follow.',
              explanation: 'The boom paid off.',
              effects: [{ resource: 'unity', delta: 10 }],
            },
            {
              id: 'boom-backlash',
              dueYear: 410,
              hint: 'If unity is low, there may be trouble.',
              condition: { resource: 'unity', below: 40 },
              explanation: 'Low unity turned into backlash.',
              lapsedExplanation: 'Unity was high enough to avoid backlash.',
              effects: [{ resource: 'legitimacy', delta: -10 }],
            },
            {
              id: 'boom-late',
              dueYear: 430,
              hint: 'Far in the future.',
              explanation: 'It arrived late.',
              effects: [{ resource: 'economy', delta: -1 }],
            },
          ],
          flagsSet: ['chose-boom'],
          nextEventId: 'b',
        },
        {
          id: 'bust',
          label: 'Bust',
          rationale: 'r',
          outcome: 'o',
          effects: [
            { resource: 'economy', delta: -30 },
            { resource: 'unity', delta: -15 },
          ],
          consequences: [
            {
              id: 'bust-backlash',
              dueYear: 410,
              hint: 'If unity is low, there may be trouble.',
              condition: { resource: 'unity', below: 40 },
              explanation: 'Low unity turned into backlash.',
              lapsedExplanation: 'Unity was high enough to avoid backlash.',
              effects: [{ resource: 'legitimacy', delta: -10 }],
            },
          ],
          flagsSet: ['chose-bust'],
          nextEventId: 'b',
        },
      ],
    },
    {
      kind: 'decision',
      id: 'b',
      year: 410,
      yearApproximate: false,
      title: 'Second',
      context: 'c',
      historicalContextIds: [],
      prompt: 'p',
      choices: [
        {
          id: 'follow-up',
          label: 'Follow up',
          rationale: 'r',
          outcome: 'o',
          prerequisites: [{ flag: 'chose-boom' }],
          effects: [{ resource: 'legitimacy', delta: -1 }],
          nextEventId: 'end',
        },
        {
          id: 'not-after-bust',
          label: 'Not after bust',
          rationale: 'r',
          outcome: 'o',
          prerequisites: [{ notFlag: 'chose-bust' }],
          effects: [{ resource: 'unity', delta: -1 }],
          nextEventId: 'end',
        },
        {
          id: 'always',
          label: 'Always open',
          rationale: 'r',
          outcome: 'o',
          effects: [{ resource: 'unity', delta: -2 }],
          conditionalEffects: [
            {
              id: 'always-after-bust',
              when: { flag: 'chose-bust' },
              explanation: 'Because of the bust, this hurts more.',
              effects: [{ resource: 'unity', delta: -3 }],
            },
          ],
          nextEventId: 'end',
        },
      ],
    },
    {
      kind: 'terminal',
      id: 'end',
      year: 420,
      yearApproximate: false,
      status: 'ending',
      title: 'End',
      summary: 's',
    },
  ],
});

function mustApply(scenario: AlternateScenario, state: SimulationState, choiceId: string): SimulationState {
  const result = applyChoice(scenario, state, choiceId);
  if (!result.ok) throw new Error(result.message);
  return result.state;
}

describe('clampResource', () => {
  it('keeps values within 0–100 and rounds them', () => {
    expect(clampResource(-5)).toBe(0);
    expect(clampResource(140)).toBe(100);
    expect(clampResource(42.6)).toBe(43);
    expect(clampResource(Number.NaN)).toBe(0);
  });
});

describe('createInitialState', () => {
  it('starts empty: no flags, records or consequences', () => {
    const state = createInitialState(fixture);
    expect(state.currentEventId).toBe('a');
    expect(state.flags).toEqual([]);
    expect(state.records).toEqual([]);
    expect(state.pending).toEqual([]);
    expect(state.resolved).toEqual([]);
    expect(state.schemaVersion).toBe(2);
    expect(state.seed).toBe(0);
  });
});

describe('immediate effects', () => {
  it('clamps at both bounds and records requested vs applied change', () => {
    const result = applyChoice(fixture, createInitialState(fixture), 'boom');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const [economy, military] = result.record.effects;
    expect(economy).toEqual({ resource: 'economy', requested: 20, applied: 5, before: 95, after: 100 });
    expect(military).toEqual({ resource: 'military', requested: -20, applied: -5, before: 5, after: 0 });
  });

  it('totals several changes to one resource', () => {
    expect(
      totalPerResource([
        { resource: 'unity', requested: -2, applied: -2, before: 50, after: 48 },
        { resource: 'economy', requested: 1, applied: 1, before: 10, after: 11 },
        { resource: 'unity', requested: -3, applied: -3, before: 48, after: 45 },
      ]),
    ).toEqual([
      { resource: 'unity', requested: -5, applied: -5, before: 50, after: 45 },
      { resource: 'economy', requested: 1, applied: 1, before: 10, after: 11 },
    ]);
  });
});

describe('prerequisites', () => {
  it('evaluates flag and not-flag prerequisites', () => {
    const afterBoom = mustApply(fixture, createInitialState(fixture), 'boom');
    const afterBust = mustApply(fixture, createInitialState(fixture), 'bust');
    const open = (state: SimulationState) =>
      evaluateChoices(fixture, state)
        .filter((e) => e.available)
        .map((e) => e.choice.id);
    expect(open(afterBoom)).toEqual(['follow-up', 'not-after-bust', 'always']);
    expect(open(afterBust)).toEqual(['always']);
    expect(checkRequirement(fixture, afterBust, { flag: 'chose-boom' }).description).toBe(
      'Requires an earlier decision: Boom',
    );
    expect(checkRequirement(fixture, afterBust, { notFlag: 'chose-bust' }).description).toBe(
      'Ruled out by an earlier decision: Bust',
    );
  });

  it('describes minimum and below thresholds with the current value', () => {
    const state = createInitialState(fixture);
    expect(checkRequirement(fixture, state, { resource: 'unity', min: 60 })).toEqual({
      requirement: { resource: 'unity', min: 60 },
      met: false,
      description: 'Political Unity 60 or more (you have 50)',
    });
    expect(checkRequirement(fixture, state, { resource: 'military', below: 10 }).met).toBe(true);
    expect(checkRequirement(fixture, state, { resource: 'military', below: 5 }).met).toBe(false);
    expect(checkRequirement(fixture, state, { resource: 'military', below: 5 }).description).toBe(
      'Military below 5 (you have 5)',
    );
  });

  it('rejects unavailable, unknown and out-of-turn choices with specific errors', () => {
    const afterBust = mustApply(fixture, createInitialState(fixture), 'bust');
    const blocked = applyChoice(fixture, afterBust, 'follow-up');
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.error).toBe('unavailable');
      expect(blocked.message).toMatch(/Requires an earlier decision: Boom/);
    }
    const unknown = applyChoice(fixture, afterBust, 'nonsense');
    expect(unknown.ok).toBe(false);
    if (!unknown.ok) expect(unknown.error).toBe('unknown-choice');
    const ended = replay(fixture, ['boom', 'always']);
    const late = applyChoice(fixture, ended, 'always');
    expect(late.ok).toBe(false);
    if (!late.ok) expect(late.error).toBe('not-at-decision');
  });
});

describe('conditional effects', () => {
  it('apply only when their condition held before the choice, and are explained', () => {
    const afterBust = mustApply(fixture, createInitialState(fixture), 'bust');
    const always = evaluateChoices(fixture, afterBust).find((e) => e.choice.id === 'always')!;
    expect(always.applicableConditionals.map((c) => c.id)).toEqual(['always-after-bust']);
    expect(always.projected).toEqual([{ resource: 'unity', requested: -5, applied: -5, before: 35, after: 30 }]);

    const result = applyChoice(fixture, afterBust, 'always');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.record.conditional).toEqual([
      {
        id: 'always-after-bust',
        explanation: 'Because of the bust, this hurts more.',
        effects: [{ resource: 'unity', requested: -3, applied: -3, before: 33, after: 30 }],
      },
    ]);
    expect(result.state.resources.unity).toBe(30);

    const afterBoom = mustApply(fixture, createInitialState(fixture), 'boom');
    const alwaysAfterBoom = evaluateChoices(fixture, afterBoom).find((e) => e.choice.id === 'always')!;
    expect(alwaysAfterBoom.applicableConditionals).toEqual([]);
  });
});

describe('scheduled consequences', () => {
  it('are pending with their hint until due, then resolve on arrival', () => {
    const result = applyChoice(fixture, createInitialState(fixture), 'boom');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.record.scheduled).toEqual(['boom-dividend', 'boom-backlash', 'boom-late']);
    const state = result.state;
    // Arrived at 410: the two consequences due in 410 resolved; the 430 one is still pending.
    expect(state.pending.map((p) => p.consequenceId)).toEqual(['boom-late']);
    expect(state.pending[0]!.hint).toBe('Far in the future.');
    const resolved = consequencesResolvedAt(state, 'b');
    expect(resolved.map((r) => [r.consequenceId, r.triggered])).toEqual([
      ['boom-dividend', true],
      ['boom-backlash', false],
    ]);
  });

  it('check conditions against the state at the time they come due', () => {
    // Boom: unity 50 → +10 dividend → 60, so the backlash (unity below 40) lapses.
    const boom = mustApply(fixture, createInitialState(fixture), 'boom');
    const lapsed = boom.resolved.find((r) => r.consequenceId === 'boom-backlash')!;
    expect(lapsed.triggered).toBe(false);
    expect(lapsed.effects).toEqual([]);
    expect(lapsed.explanation).toBe('Unity was high enough to avoid backlash.');
    expect(boom.resources.unity).toBe(60);
    expect(boom.resources.legitimacy).toBe(50);

    // Bust: unity 50 → −15 → 35, so the backlash takes effect.
    const bust = mustApply(fixture, createInitialState(fixture), 'bust');
    const hit = bust.resolved.find((r) => r.consequenceId === 'bust-backlash')!;
    expect(hit.triggered).toBe(true);
    expect(hit.explanation).toBe('Low unity turned into backlash.');
    expect(hit.effects).toEqual([{ resource: 'legitimacy', requested: -10, applied: -10, before: 50, after: 40 }]);
    expect(bust.resources.legitimacy).toBe(40);
  });

  it('stay pending past the last written decision until a later node is reached', () => {
    const ended = replay(fixture, ['boom', 'always']);
    expect(ended.year).toBe(420);
    expect(ended.pending.map((p) => p.consequenceId)).toEqual(['boom-late']);
  });

  it('are logged in plain language', () => {
    const state = mustApply(fixture, createInitialState(fixture), 'boom');
    expect(state.eventLog).toEqual(['First: Boom', '410: The boom paid off.', '410: Unity was high enough to avoid backlash.']);
  });
});

describe('determinism and immutability', () => {
  it('the same choices always give the same state', () => {
    for (const path of enumeratePaths(fixture)) {
      expect(JSON.stringify(replay(fixture, path))).toBe(JSON.stringify(replay(fixture, path)));
    }
  });

  it('never mutates its input state', () => {
    const start = deepFreeze(createInitialState(fixture));
    const snapshot = JSON.stringify(start);
    const afterBoom = deepFreeze(mustApply(fixture, start, 'boom'));
    const boomSnapshot = JSON.stringify(afterBoom);
    mustApply(fixture, afterBoom, 'always');
    expect(JSON.stringify(start)).toBe(snapshot);
    expect(JSON.stringify(afterBoom)).toBe(boomSnapshot);
  });

  it('marks an ending when a terminal ending node is reached', () => {
    expect(replay(fixture, ['boom', 'always']).endingId).toBe('end');
  });

  it('replay throws on an invalid step', () => {
    expect(() => replay(fixture, ['bust', 'follow-up'])).toThrow(Error);
  });

  it('enumerates every path honouring prerequisites', () => {
    expect(enumeratePaths(fixture)).toHaveLength(4);
    for (const path of enumeratePaths(fixture)) expect(getCurrentNode(fixture, replay(fixture, path)).kind).toBe('terminal');
  });
});

describe('validateScenario', () => {
  it('accepts the fixture', () => {
    expect(validateScenario(fixture)).toEqual([]);
  });

  it('reports broken links, missing start, unknown flags, free choices and bad starting values', () => {
    const broken: AlternateScenario = {
      ...fixture,
      startNodeId: 'missing',
      initialResources: { ...fixture.initialResources, unity: 140 },
      nodes: fixture.nodes.map((node) =>
        node.kind === 'decision' && node.id === 'a'
          ? {
              ...node,
              choices: [
                { ...node.choices[0]!, nextEventId: 'nowhere', flagsSet: ['ghost-flag'] },
                { ...node.choices[1]!, effects: [{ resource: 'unity', delta: 5 }] },
              ],
            }
          : node,
      ),
    };
    const errors = validateScenario(broken).join('\n');
    expect(errors).toMatch(/Start node "missing" does not exist/);
    expect(errors).toMatch(/Initial unity must be between/);
    expect(errors).toMatch(/next node "nowhere" does not exist/);
    expect(errors).toMatch(/unknown flag "ghost-flag"/);
    expect(errors).toMatch(/has no downside/);
  });

  it('reports consequences due too early, without a lapse explanation, or with duplicate ids', () => {
    const broken: AlternateScenario = {
      ...fixture,
      nodes: fixture.nodes.map((node) =>
        node.kind === 'decision' && node.id === 'a'
          ? {
              ...node,
              choices: [
                {
                  ...node.choices[0]!,
                  consequences: [
                    { id: 'dup', dueYear: 400, hint: 'h', explanation: 'e', effects: [{ resource: 'unity', delta: 1 }] },
                    {
                      id: 'dup',
                      dueYear: 405,
                      hint: 'h',
                      explanation: 'e',
                      condition: { resource: 'unity', min: 10 },
                      effects: [{ resource: 'unity', delta: 1 }],
                    },
                  ],
                },
                node.choices[1]!,
              ],
            }
          : node,
      ),
    };
    const errors = validateScenario(broken).join('\n');
    expect(errors).toMatch(/consequence dup: must fall due after 400/);
    expect(errors).toMatch(/consequence dup: duplicate id/);
    expect(errors).toMatch(/must explain what happens when it lapses/);
  });

  it('reports cycles, unreachable nodes and decisions where every choice is gated', () => {
    const cyclic: AlternateScenario = {
      ...fixture,
      nodes: [
        ...fixture.nodes.map((node) =>
          node.kind === 'decision' && node.id === 'b'
            ? {
                ...node,
                choices: node.choices.map((choice) => ({
                  ...choice,
                  nextEventId: 'a',
                  prerequisites: [{ flag: 'chose-boom' }],
                })),
              }
            : node,
        ),
        {
          kind: 'terminal' as const,
          id: 'orphan',
          year: 430,
          yearApproximate: false,
          status: 'ending' as const,
          title: 'o',
          summary: 's',
        },
      ],
    };
    const errors = validateScenario(cyclic).join('\n');
    expect(errors).toMatch(/Cycle: a → b → a/);
    expect(errors).toMatch(/Node orphan: unreachable/);
    expect(errors).toMatch(/every choice has prerequisites/);
  });
});
