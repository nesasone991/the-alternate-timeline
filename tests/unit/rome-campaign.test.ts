import { describe, expect, it } from 'vitest';
import { romeAlternateScenario as rome } from '../../src/data/scenarios/rome/alternate';
import { romeActualTimeline } from '../../src/data/scenarios/rome/history';
import {
  applyChoice,
  consequencesResolvedAt,
  createInitialState,
  decisionNumber,
  enumeratePaths,
  evaluateChoices,
  getCurrentNode,
  replay,
} from '../../src/features/simulation/engine';
import { validateScenario } from '../../src/features/simulation/validateScenario';
import { RESOURCE_KEYS, type Resources, type SimulationState } from '../../src/types/simulation';

const actualIds = romeActualTimeline.events.map((event) => event.id);
const D1 = ['reform-taxation', 'provincial-revenue', 'pay-the-armies'] as const;
const D2 = ['hold-italy', 'field-army', 'settle-federates'] as const;

const R = (economy: number, military: number, unity: number, legitimacy: number): Resources => ({
  economy,
  military,
  unity,
  legitimacy,
});

/**
 * Expected resources (economy, military, unity, legitimacy), calculated by hand
 * from alternate.ts. Start: 40 / 45 / 35 / 30.
 * After D1 (including consequences that land on arrival in 459):
 *   reform taxation   52/45/31/24, then +4 economy (steadier revenue) → 56/45/31/24
 *   provincial share  32/45/45/27
 *   pay the armies    28/59/35/34, then −3 economy (armies expect pay) → 25/59/35/34
 */
const afterD1: Record<(typeof D1)[number], Resources> = {
  'reform-taxation': R(56, 45, 31, 24),
  'provincial-revenue': R(32, 45, 45, 27),
  'pay-the-armies': R(25, 59, 35, 34),
};

const matrix: Record<string, Resources | 'blocked'> = {
  'reform-taxation/hold-italy': R(56, 49, 23, 29),
  'reform-taxation/field-army': R(46, 53, 35, 24),
  'reform-taxation/settle-federates': R(59, 52, 31, 17),
  'provincial-revenue/hold-italy': R(32, 49, 37, 32),
  'provincial-revenue/field-army': R(22, 53, 49, 27),
  'provincial-revenue/settle-federates': R(35, 52, 49, 20), // +4 unity: provinces already share revenue
  'pay-the-armies/hold-italy': R(25, 67, 27, 39), // +4 military: troops already paid
  'pay-the-armies/field-army': 'blocked', // economy 25 is below the 30 needed
  'pay-the-armies/settle-federates': R(28, 66, 35, 27),
};

function after(...choices: string[]): SimulationState {
  return replay(rome, choices);
}

describe('Rome scenario integrity', () => {
  it('passes the validator, including links to real event ids', () => {
    expect(validateScenario(rome, actualIds)).toEqual([]);
  });

  it('starts at decision 1 with the authored resources', () => {
    const state = createInitialState(rome);
    expect(state.currentEventId).toBe('d1-fiscal-survival');
    expect(state.year).toBe(455);
    expect(state.resources).toEqual(R(40, 45, 35, 30));
    expect(state.scenarioVersion).toBe(2);
  });

  it('every choice explains its outcome and costs something', () => {
    for (const node of rome.nodes) {
      if (node.kind !== 'decision') continue;
      for (const choice of node.choices) {
        expect(choice.outcome.length).toBeGreaterThan(40);
        expect(choice.effects.some((effect) => effect.delta < 0)).toBe(true);
        expect(choice.effects.some((effect) => effect.delta > 0)).toBe(true);
      }
    }
  });

  it('consequence hints never reveal numbers', () => {
    for (const node of rome.nodes) {
      if (node.kind !== 'decision') continue;
      for (const choice of node.choices) {
        for (const consequence of choice.consequences ?? []) expect(/\d/.test(consequence.hint)).toBe(false);
      }
    }
  });
});

describe('decision 1 and its delayed consequences', () => {
  it('records each choice’s immediate change', () => {
    const immediate: Record<string, Resources> = {
      'reform-taxation': R(52, 45, 31, 24),
      'provincial-revenue': R(32, 45, 45, 27),
      'pay-the-armies': R(28, 59, 35, 34),
    };
    for (const choice of D1) {
      const result = applyChoice(rome, createInitialState(rome), choice);
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      const totals = Object.fromEntries(result.record.effects.map((e) => [e.resource, e.after]));
      for (const key of RESOURCE_KEYS) {
        if (totals[key] !== undefined) expect(totals[key]).toBe(immediate[choice]![key]);
      }
    }
  });

  it('applies consequences due in 459 on arrival at decision 2, and explains them', () => {
    const tax = after('reform-taxation');
    expect(tax.currentEventId).toBe('d2-border-defence');
    expect(tax.resources).toEqual(afterD1['reform-taxation']);
    const taxArrivals = consequencesResolvedAt(tax, 'd2-border-defence');
    expect(taxArrivals.map((c) => [c.consequenceId, c.triggered])).toEqual([['tax-reform-revenue', true]]);
    expect(taxArrivals[0]!.explanation).toBe('Reformed collection brought in steadier revenue than before.');

    const armies = after('pay-the-armies');
    expect(armies.resources).toEqual(afterD1['pay-the-armies']);
    expect(consequencesResolvedAt(armies, 'd2-border-defence').map((c) => c.consequenceId)).toEqual([
      'armies-expect-pay',
    ]);

    const provinces = after('provincial-revenue');
    expect(provinces.resources).toEqual(afterD1['provincial-revenue']);
    expect(consequencesResolvedAt(provinces, 'd2-border-defence')).toEqual([]);
  });

  it('keeps later consequences pending with their hint and year, not their numbers', () => {
    const tax = after('reform-taxation');
    expect(tax.pending.map((p) => [p.consequenceId, p.dueYear])).toEqual([['tax-reform-landowners', 468]]);
    expect(tax.pending[0]!.hint).toMatch(/landowners/);
    expect(after('provincial-revenue').pending.map((p) => p.consequenceId)).toEqual(['provincial-revenue-shortfall']);
    expect(after('pay-the-armies').pending).toEqual([]);
  });
});

describe('decision 2: border defence', () => {
  it('is decision 2 of 5, c. 459', () => {
    const state = after('reform-taxation');
    const node = getCurrentNode(rome, state);
    expect(node.kind).toBe('decision');
    expect(decisionNumber(rome, node.id)).toBe(2);
    expect(state.year).toBe(459);
  });

  it('validates all nine D1–D2 combinations', () => {
    let reachable = 0;
    for (const first of D1) {
      for (const second of D2) {
        const key = `${first}/${second}`;
        const expected = matrix[key];
        const result = applyChoice(rome, after(first), second);
        if (expected === 'blocked') {
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error).toBe('unavailable');
            expect(result.message).toBe('Not available: Economy 30 or more (you have 25).');
          }
          continue;
        }
        expect(result.ok).toBe(true);
        if (!result.ok) continue;
        reachable += 1;
        expect(result.state.resources).toEqual(expected);
        expect(result.state.currentEventId).toBe('checkpoint-d3');
        expect(result.state.year).toBe(461);
        expect(result.state.choicesMade).toEqual([first, second]);
        for (const key2 of RESOURCE_KEYS) {
          const value = result.state.resources[key2];
          expect(value >= 0 && value <= 100).toBe(true);
        }
      }
    }
    expect(reachable).toBe(8);
    expect(enumeratePaths(rome)).toHaveLength(8);
  });

  it('decision 1 changes decision 2 in a visible, explained way', () => {
    const options = (first: string) =>
      Object.fromEntries(evaluateChoices(rome, after(first)).map((e) => [e.choice.id, e]));

    const armies = options('pay-the-armies');
    expect(armies['field-army']!.available).toBe(false);
    expect(armies['field-army']!.requirements[0]!.description).toBe('Economy 30 or more (you have 25)');
    expect(armies['hold-italy']!.applicableConditionals.map((c) => c.id)).toEqual(['italy-paid-troops']);
    expect(armies['hold-italy']!.applicableConditionals[0]!.explanation).toMatch(/^Because you paid the armies first/);

    const provinces = options('provincial-revenue');
    expect(provinces['settle-federates']!.applicableConditionals.map((c) => c.id)).toEqual([
      'federates-provincial-partners',
    ]);
    expect(provinces['field-army']!.available).toBe(true);

    const tax = options('reform-taxation');
    expect(Object.values(tax).every((e) => e.available && e.applicableConditionals.length === 0)).toBe(true);
  });

  it('no D2 option is better than another on every resource, from any D1 starting point', () => {
    for (const first of D1) {
      const start = after(first);
      const outcomes = evaluateChoices(rome, start)
        .filter((e) => e.available)
        .map((e) => replay(rome, [first, e.choice.id]).resources);
      for (const a of outcomes) {
        for (const b of outcomes) {
          if (a === b) continue;
          expect(RESOURCE_KEYS.every((key) => a[key] >= b[key])).toBe(false);
        }
      }
    }
  });

  it('every D2 choice schedules a later consequence, still pending at the checkpoint', () => {
    expect(after('reform-taxation', 'hold-italy').pending.map((p) => [p.consequenceId, p.dueYear])).toEqual([
      ['tax-reform-landowners', 468],
      ['italy-provinces-drift', 468],
    ]);
    expect(after('provincial-revenue', 'field-army').pending.map((p) => p.consequenceId)).toEqual([
      'provincial-revenue-shortfall',
      'field-army-upkeep',
      'field-army-victories',
    ]);
    expect(after('pay-the-armies', 'settle-federates').pending.map((p) => [p.consequenceId, p.dueYear])).toEqual([
      ['federates-demands', 476],
    ]);
    for (const path of enumeratePaths(rome)) {
      const state = replay(rome, path);
      expect(state.pending.every((p) => p.dueYear > 461)).toBe(true);
      expect(state.resolved.every((r) => r.resolvedYear <= 461)).toBe(true);
    }
  });

  it('is deterministic and leaves actual history untouched across all paths', () => {
    const before = JSON.stringify(romeActualTimeline);
    for (const path of enumeratePaths(rome)) {
      expect(JSON.stringify(replay(rome, path))).toBe(JSON.stringify(replay(rome, path)));
    }
    expect(JSON.stringify(romeActualTimeline)).toBe(before);
    expect(Object.isFrozen(rome)).toBe(true);
  });
});
