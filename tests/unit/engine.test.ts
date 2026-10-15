import { describe, expect, it } from 'vitest';
import { romeAlternateScenario } from '../../src/data/scenarios/rome/alternate';
import { romeActualTimeline } from '../../src/data/scenarios/rome/history';
import {
  applyChoice,
  checkRequirement,
  clampResource,
  createInitialState,
  decisionNumber,
  enumeratePaths,
  evaluateChoices,
  getCurrentDecision,
  getCurrentNode,
  replay,
} from '../../src/features/simulation/engine';
import { validateScenario } from '../../src/features/simulation/validateScenario';
import { deepFreeze } from '../../src/lib/freeze';
import { RESOURCE_KEYS, type AlternateScenario, type SimulationState } from '../../src/types/simulation';

const rome = romeAlternateScenario;
const actualIds = romeActualTimeline.events.map((event) => event.id);

/** A small scenario that exercises clamping, flag prerequisites and multi-step paths. */
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
          effects: [
            { resource: 'economy', delta: 20 },
            { resource: 'military', delta: -20 },
          ],
          flagsSet: ['chose-boom'],
          nextEventId: 'b',
        },
        {
          id: 'bust',
          label: 'Bust',
          rationale: 'r',
          effects: [
            { resource: 'economy', delta: -30 },
            { resource: 'unity', delta: 5 },
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
          prerequisites: [{ flag: 'chose-boom' }],
          effects: [{ resource: 'legitimacy', delta: -1 }],
          nextEventId: 'end',
        },
        {
          id: 'not-after-bust',
          label: 'Not after bust',
          rationale: 'r',
          prerequisites: [{ notFlag: 'chose-bust' }],
          effects: [{ resource: 'unity', delta: -1 }],
          nextEventId: 'end',
        },
        {
          id: 'always',
          label: 'Always open',
          rationale: 'r',
          effects: [{ resource: 'unity', delta: -2 }],
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
  it('starts at the first decision with the authored resources', () => {
    const state = createInitialState(rome);
    expect(state.currentEventId).toBe('d1-fiscal-survival');
    expect(state.year).toBe(455);
    expect(state.resources).toEqual({ economy: 40, military: 45, unity: 35, legitimacy: 30 });
    expect(state.flags).toEqual([]);
    expect(state.records).toEqual([]);
    expect(state.scenarioVersion).toBe(1);
    expect(state.seed).toBe(0);
  });
});

describe('Rome decision 1: fiscal survival', () => {
  it('offers three choices, all available at the start', () => {
    const evaluations = evaluateChoices(rome, createInitialState(rome));
    expect(evaluations.map((e) => e.choice.id)).toEqual(['reform-taxation', 'provincial-revenue', 'pay-the-armies']);
    expect(evaluations.every((e) => e.available)).toBe(true);
    expect(decisionNumber(rome, 'd1-fiscal-survival')).toBe(1);
  });

  it('reform taxation: economy up, legitimacy and unity down, flag set', () => {
    const state = mustApply(rome, createInitialState(rome), 'reform-taxation');
    expect(state.resources).toEqual({ economy: 52, military: 45, unity: 31, legitimacy: 24 });
    expect(state.flags).toEqual(['tax-reform']);
  });

  it('provincial revenue: unity up, economy and legitimacy down, flag set', () => {
    const state = mustApply(rome, createInitialState(rome), 'provincial-revenue');
    expect(state.resources).toEqual({ economy: 32, military: 45, unity: 45, legitimacy: 27 });
    expect(state.flags).toEqual(['provincial-revenue']);
  });

  it('pay the armies: military and legitimacy up, economy down, flag set', () => {
    const state = mustApply(rome, createInitialState(rome), 'pay-the-armies');
    expect(state.resources).toEqual({ economy: 28, military: 59, unity: 35, legitimacy: 34 });
    expect(state.flags).toEqual(['armies-paid-first']);
  });

  it('every choice leads to the in-development checkpoint and is recorded', () => {
    for (const id of ['reform-taxation', 'provincial-revenue', 'pay-the-armies']) {
      const state = mustApply(rome, createInitialState(rome), id);
      const node = getCurrentNode(rome, state);
      expect(node.id).toBe('checkpoint-d2');
      expect(node.kind).toBe('terminal');
      expect(state.year).toBe(458);
      expect(state.choicesMade).toEqual([id]);
      expect(state.records).toHaveLength(1);
      expect(state.records[0]!.decisionId).toBe('d1-fiscal-survival');
      expect(state.eventLog).toHaveLength(1);
      expect(getCurrentDecision(rome, state)).toBeUndefined();
      expect(state.endingId).toBeUndefined();
    }
  });

  it('no choice is free: each raises something and lowers something', () => {
    for (const evaluation of evaluateChoices(rome, createInitialState(rome))) {
      expect(evaluation.choice.effects.some((e) => e.delta > 0)).toBe(true);
      expect(evaluation.choice.effects.some((e) => e.delta < 0)).toBe(true);
    }
  });

  it('no choice dominates another on every resource', () => {
    const start = createInitialState(rome);
    const outcomes = evaluateChoices(rome, start).map((e) => mustApply(rome, start, e.choice.id).resources);
    for (const a of outcomes) {
      for (const b of outcomes) {
        if (a === b) continue;
        expect(RESOURCE_KEYS.every((key) => a[key] >= b[key])).toBe(false);
      }
    }
  });

  it('tax reform is blocked when legitimacy is below 20, with a reason', () => {
    const weak: SimulationState = { ...createInitialState(rome), resources: { economy: 40, military: 45, unity: 35, legitimacy: 15 } };
    const tax = evaluateChoices(rome, weak).find((e) => e.choice.id === 'reform-taxation')!;
    expect(tax.available).toBe(false);
    expect(tax.requirements[0]!.description).toBe('Legitimacy 20 or more (you have 15)');
    const result = applyChoice(rome, weak, 'reform-taxation');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('unavailable');
      expect(result.message).toMatch(/Legitimacy 20 or more/);
    }
  });

  it('paying the armies needs economy 30 or more; the boundary value is allowed', () => {
    const at = (economy: number): SimulationState => ({
      ...createInitialState(rome),
      resources: { economy, military: 45, unity: 35, legitimacy: 30 },
    });
    const available = (economy: number) =>
      evaluateChoices(rome, at(economy)).find((e) => e.choice.id === 'pay-the-armies')!.available;
    expect(available(29)).toBe(false);
    expect(available(30)).toBe(true);
  });

  it('provincial revenue has no prerequisite, so decision 1 can never softlock', () => {
    const broke: SimulationState = { ...createInitialState(rome), resources: { economy: 0, military: 0, unity: 0, legitimacy: 0 } };
    const open = evaluateChoices(rome, broke).filter((e) => e.available).map((e) => e.choice.id);
    expect(open).toEqual(['provincial-revenue']);
  });
});

describe('engine rules', () => {
  it('clamps at both bounds and records requested vs applied change', () => {
    const state = mustApply(fixture, createInitialState(fixture), 'boom');
    expect(state.resources.economy).toBe(100);
    expect(state.resources.military).toBe(0);
    const [economy, military] = state.records[0]!.effects;
    expect(economy).toEqual({ resource: 'economy', requested: 20, applied: 5, before: 95, after: 100 });
    expect(military).toEqual({ resource: 'military', requested: -20, applied: -5, before: 5, after: 0 });
  });

  it('evaluates flag and not-flag prerequisites', () => {
    const afterBoom = mustApply(fixture, createInitialState(fixture), 'boom');
    const afterBust = mustApply(fixture, createInitialState(fixture), 'bust');
    const open = (state: SimulationState) => evaluateChoices(fixture, state).filter((e) => e.available).map((e) => e.choice.id);
    expect(open(afterBoom)).toEqual(['follow-up', 'not-after-bust', 'always']);
    expect(open(afterBust)).toEqual(['always']);
    expect(checkRequirement(fixture, afterBust, { flag: 'chose-boom' }).description).toBe('Requires an earlier decision: Boom');
    expect(checkRequirement(fixture, afterBust, { notFlag: 'chose-bust' }).description).toBe(
      'Ruled out by an earlier decision: Bust',
    );
  });

  it('marks an ending when a terminal ending node is reached', () => {
    const state = replay(fixture, ['boom', 'always']);
    expect(state.endingId).toBe('end');
    expect(state.year).toBe(420);
  });

  it('rejects unknown choices and choices after the decision is over', () => {
    const start = createInitialState(rome);
    const unknown = applyChoice(rome, start, 'raise-taxes-forever');
    expect(unknown.ok).toBe(false);
    if (!unknown.ok) expect(unknown.error).toBe('unknown-choice');

    const done = mustApply(rome, start, 'reform-taxation');
    const again = applyChoice(rome, done, 'reform-taxation');
    expect(again.ok).toBe(false);
    if (!again.ok) expect(again.error).toBe('not-at-decision');
  });

  it('never mutates its input state (all inputs frozen)', () => {
    const start = deepFreeze(createInitialState(rome));
    const snapshot = JSON.stringify(start);
    const next = mustApply(rome, start, 'pay-the-armies');
    expect(JSON.stringify(start)).toBe(snapshot);
    expect(next === start).toBe(false);
  });

  it('is deterministic: the same choices always give the same state', () => {
    for (const path of enumeratePaths(fixture)) {
      expect(JSON.stringify(replay(fixture, path))).toBe(JSON.stringify(replay(fixture, path)));
    }
    expect(JSON.stringify(replay(rome, ['provincial-revenue']))).toBe(
      JSON.stringify(mustApply(rome, createInitialState(rome), 'provincial-revenue')),
    );
  });

  it('replay throws on an invalid step', () => {
    expect(() => replay(fixture, ['bust', 'follow-up'])).toThrow(Error);
  });
});

describe('path matrix', () => {
  it('enumerates every reachable path, each ending at a node with no open choice', () => {
    const romePaths = enumeratePaths(rome);
    expect(romePaths).toEqual([['reform-taxation'], ['provincial-revenue'], ['pay-the-armies']]);
    for (const path of romePaths) {
      const state = replay(rome, path);
      expect(getCurrentNode(rome, state).kind).toBe('terminal');
      for (const key of RESOURCE_KEYS) {
        expect(state.resources[key] >= 0 && state.resources[key] <= 100).toBe(true);
      }
    }
    // Fixture: boom → 3 options, bust → 1 option.
    expect(enumeratePaths(fixture)).toHaveLength(4);
  });

  it('leaves the actual-history dataset untouched after every path', () => {
    const before = JSON.stringify(romeActualTimeline);
    for (const path of enumeratePaths(rome)) replay(rome, path);
    expect(JSON.stringify(romeActualTimeline)).toBe(before);
    expect(Object.isFrozen(romeAlternateScenario)).toBe(true);
  });
});

describe('validateScenario', () => {
  it('accepts the Rome scenario and the fixture', () => {
    expect(validateScenario(rome, actualIds)).toEqual([]);
    expect(validateScenario(fixture)).toEqual([]);
  });

  it('links decision context only to real event ids', () => {
    const decision = rome.nodes.find((node) => node.kind === 'decision')!;
    if (decision.kind === 'decision') {
      for (const id of decision.historicalContextIds) expect(actualIds.includes(id)).toBe(true);
    }
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

  it('reports cycles, unreachable nodes and decisions where every choice is gated', () => {
    const cyclic: AlternateScenario = {
      ...fixture,
      nodes: [
        ...fixture.nodes.map((node) =>
          node.kind === 'decision' && node.id === 'b'
            ? { ...node, choices: node.choices.map((choice) => ({ ...choice, nextEventId: 'a', prerequisites: [{ flag: 'chose-boom' }] })) }
            : node,
        ),
        { kind: 'terminal' as const, id: 'orphan', year: 430, yearApproximate: false, status: 'ending' as const, title: 'o', summary: 's' },
      ],
    };
    const errors = validateScenario(cyclic).join('\n');
    expect(errors).toMatch(/Cycle: a → b → a/);
    expect(errors).toMatch(/Node orphan: unreachable/);
    expect(errors).toMatch(/every choice has prerequisites/);
  });

  it('reports unknown historical event links when actual ids are supplied', () => {
    const errors = validateScenario(rome, ['some-other-event']).join('\n');
    expect(errors).toMatch(/unknown historical event "vandals-take-carthage-439"/);
  });
});
