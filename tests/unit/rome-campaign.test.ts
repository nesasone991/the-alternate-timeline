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
const D3 = ['join-expedition', 'treaty-with-gaiseric', 'fortify-what-remains'] as const;

const R = (economy: number, military: number, unity: number, legitimacy: number): Resources => ({
  economy,
  military,
  unity,
  legitimacy,
});

type Expected =
  | { status: 'valid'; atD3: Resources; final: Resources; pending: string[] }
  | { status: 'blocked-d2' }
  | { status: 'blocked-d3'; atD3: Resources };

/**
 * Expected outcome of every theoretical D1 × D2 × D3 combination, resources as
 * (economy, military, unity, legitimacy). Produced by an independent reference
 * model of the rules (a separate Python calculation, not this engine), then
 * pasted here. `atD3` is the state when Decision 3 is shown — i.e. AFTER the
 * consequences due in 468 have taken effect.
 */
const MATRIX: Record<string, Expected> = {
  'reform-taxation/hold-italy/join-expedition': { status: 'blocked-d3', atD3: R(56, 49, 17, 29) },
  'reform-taxation/hold-italy/treaty-with-gaiseric': { status: 'valid', atD3: R(56, 49, 17, 29), final: R(68, 49, 19, 21), pending: ["treaty-eastern-resentment", "treaty-holds"] },
  'reform-taxation/hold-italy/fortify-what-remains': { status: 'valid', atD3: R(56, 49, 17, 29), final: R(50, 52, 23, 25), pending: ["sea-left-to-vandals"] },
  'reform-taxation/field-army/join-expedition': { status: 'valid', atD3: R(41, 56, 35, 23), final: R(29, 54, 35, 29), pending: ["expedition-debts", "expedition-reprisal"] },
  'reform-taxation/field-army/treaty-with-gaiseric': { status: 'valid', atD3: R(41, 56, 35, 23), final: R(49, 56, 37, 15), pending: ["treaty-eastern-resentment", "treaty-holds"] },
  'reform-taxation/field-army/fortify-what-remains': { status: 'valid', atD3: R(41, 56, 35, 23), final: R(35, 59, 44, 19), pending: ["sea-left-to-vandals"] },
  'reform-taxation/settle-federates/join-expedition': { status: 'valid', atD3: R(59, 52, 31, 12), final: R(47, 46, 31, 18), pending: ["federates-demands", "expedition-debts", "expedition-reprisal"] },
  'reform-taxation/settle-federates/treaty-with-gaiseric': { status: 'blocked-d3', atD3: R(59, 52, 31, 12) },
  'reform-taxation/settle-federates/fortify-what-remains': { status: 'valid', atD3: R(59, 52, 31, 12), final: R(53, 58, 37, 8), pending: ["federates-demands", "sea-left-to-vandals"] },
  'provincial-revenue/hold-italy/join-expedition': { status: 'blocked-d3', atD3: R(28, 49, 37, 32) },
  'provincial-revenue/hold-italy/treaty-with-gaiseric': { status: 'valid', atD3: R(28, 49, 37, 32), final: R(40, 49, 39, 24), pending: ["treaty-eastern-resentment", "treaty-holds"] },
  'provincial-revenue/hold-italy/fortify-what-remains': { status: 'valid', atD3: R(28, 49, 37, 32), final: R(22, 52, 43, 28), pending: ["sea-left-to-vandals"] },
  'provincial-revenue/field-army/join-expedition': { status: 'valid', atD3: R(13, 53, 49, 27), final: R(1, 51, 49, 33), pending: ["expedition-debts", "expedition-reprisal"] },
  'provincial-revenue/field-army/treaty-with-gaiseric': { status: 'valid', atD3: R(13, 53, 49, 27), final: R(21, 53, 51, 19), pending: ["treaty-eastern-resentment", "treaty-holds"] },
  'provincial-revenue/field-army/fortify-what-remains': { status: 'valid', atD3: R(13, 53, 49, 27), final: R(7, 56, 58, 23), pending: ["sea-left-to-vandals"] },
  'provincial-revenue/settle-federates/join-expedition': { status: 'valid', atD3: R(31, 52, 49, 20), final: R(19, 46, 49, 26), pending: ["federates-demands", "expedition-debts", "expedition-reprisal"] },
  'provincial-revenue/settle-federates/treaty-with-gaiseric': { status: 'valid', atD3: R(31, 52, 49, 20), final: R(39, 52, 51, 12), pending: ["federates-demands", "treaty-eastern-resentment", "treaty-holds"] },
  'provincial-revenue/settle-federates/fortify-what-remains': { status: 'valid', atD3: R(31, 52, 49, 20), final: R(25, 58, 55, 16), pending: ["federates-demands", "sea-left-to-vandals"] },
  'pay-the-armies/hold-italy/join-expedition': { status: 'valid', atD3: R(25, 67, 21, 39), final: R(18, 61, 21, 45), pending: ["expedition-debts", "expedition-reprisal"] },
  'pay-the-armies/hold-italy/treaty-with-gaiseric': { status: 'valid', atD3: R(25, 67, 21, 39), final: R(37, 67, 23, 31), pending: ["treaty-eastern-resentment", "treaty-holds"] },
  'pay-the-armies/hold-italy/fortify-what-remains': { status: 'valid', atD3: R(25, 67, 21, 39), final: R(19, 70, 27, 35), pending: ["sea-left-to-vandals"] },
  'pay-the-armies/field-army/join-expedition': { status: 'blocked-d2' },
  'pay-the-armies/field-army/treaty-with-gaiseric': { status: 'blocked-d2' },
  'pay-the-armies/field-army/fortify-what-remains': { status: 'blocked-d2' },
  'pay-the-armies/settle-federates/join-expedition': { status: 'valid', atD3: R(28, 66, 35, 27), final: R(21, 60, 35, 33), pending: ["federates-demands", "expedition-debts", "expedition-reprisal"] },
  'pay-the-armies/settle-federates/treaty-with-gaiseric': { status: 'valid', atD3: R(28, 66, 35, 27), final: R(36, 66, 37, 19), pending: ["federates-demands", "treaty-eastern-resentment", "treaty-holds"] },
  'pay-the-armies/settle-federates/fortify-what-remains': { status: 'valid', atD3: R(28, 66, 35, 27), final: R(22, 72, 41, 23), pending: ["federates-demands", "sea-left-to-vandals"] },};

function after(...choices: string[]): SimulationState {
  return replay(rome, choices);
}

describe('Rome scenario integrity', () => {
  it('passes the validator, including links to real event ids', () => {
    expect(validateScenario(rome, actualIds)).toEqual([]);
  });

  it('is version 3, with a change note for every version', () => {
    expect(rome.version).toBe(3);
    expect(rome.changes.map((change) => change.version)).toEqual([1, 2, 3]);
    expect(createInitialState(rome).scenarioVersion).toBe(3);
  });

  it('starts at decision 1 with the authored resources', () => {
    const state = createInitialState(rome);
    expect(state.currentEventId).toBe('d1-fiscal-survival');
    expect(state.resources).toEqual(R(40, 45, 35, 30));
  });

  it('every choice explains its outcome, costs something and gains something', () => {
    for (const node of rome.nodes) {
      if (node.kind !== 'decision') continue;
      for (const choice of node.choices) {
        expect(choice.outcome.length).toBeGreaterThan(40);
        expect(choice.effects.some((effect) => effect.delta < 0)).toBe(true);
        expect(choice.effects.some((effect) => effect.delta > 0)).toBe(true);
      }
    }
  });

  it('every decision 3 option has a prerequisite or later consequence, and a full narrative', () => {
    const d3 = rome.nodes.find((node) => node.id === 'd3-north-africa');
    expect(d3?.kind).toBe('decision');
    if (d3?.kind !== 'decision') return;
    expect(d3.choices.map((c) => c.id)).toEqual([...D3]);
    for (const choice of d3.choices) {
      expect((choice.consequences ?? []).length).toBeGreaterThan(0);
      const n = choice.narrative!;
      expect(n.ordered).toMatch(/^You /);
      expect(n.stakeholders.some((s) => s.impact === 'gains' && !s.when)).toBe(true);
      expect(n.stakeholders.some((s) => s.impact === 'loses' && !s.when)).toBe(true);
      expect(n.uncertainty.length).toBeGreaterThan(40);
    }
    // At least one option is gated (no softlock: fortifying is always open).
    expect(d3.choices.filter((c) => (c.prerequisites ?? []).length > 0).map((c) => c.id)).toEqual([
      'join-expedition',
      'treaty-with-gaiseric',
    ]);
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

describe('decisions 1 and 2 (regression)', () => {
  it('applies consequences due in 459 on arrival at decision 2', () => {
    expect(after('reform-taxation').resources).toEqual(R(56, 45, 31, 24));
    expect(after('provincial-revenue').resources).toEqual(R(32, 45, 45, 27));
    expect(after('pay-the-armies').resources).toEqual(R(25, 59, 35, 34));
    expect(consequencesResolvedAt(after('pay-the-armies'), 'd2-border-defence').map((c) => c.consequenceId)).toEqual([
      'armies-expect-pay',
    ]);
  });

  it('decision 1 shapes decision 2 in visible, explained ways', () => {
    const options = (first: string) =>
      Object.fromEntries(evaluateChoices(rome, after(first)).map((e) => [e.choice.id, e]));
    expect(options('pay-the-armies')['field-army']!.available).toBe(false);
    expect(options('pay-the-armies')['field-army']!.requirements[0]!.description).toBe('Economy 30 or more (you have 25)');
    expect(options('pay-the-armies')['hold-italy']!.applicableConditionals.map((c) => c.id)).toEqual(['italy-paid-troops']);
    expect(options('provincial-revenue')['settle-federates']!.applicableConditionals.map((c) => c.id)).toEqual([
      'federates-provincial-partners',
    ]);
    expect(options('reform-taxation')['field-army']!.applicableConditionals.map((c) => c.id)).toEqual([
      'field-army-funded',
    ]);
  });
});

describe('the consequences due in 468', () => {
  it('resolve on arrival at decision 3, before the player decides', () => {
    for (const first of D1) {
      for (const second of D2) {
        const result = applyChoice(rome, after(first), second);
        if (!result.ok) continue;
        const state = result.state;
        expect(state.currentEventId).toBe('d3-north-africa');
        expect(state.year).toBe(468);
        // Nothing due by 468 is left pending: it has all been applied (or lapsed) already.
        expect(state.pending.filter((p) => p.dueYear <= 468)).toEqual([]);
        for (const item of consequencesResolvedAt(state, 'd3-north-africa')) {
          expect(item.resolvedYear).toBe(468);
          expect(item.dueYear).toBe(468);
        }
        // Decision 3 is evaluated against the post-consequence state.
        expect(evaluateChoices(rome, state).length).toBe(3);
      }
    }
  });

  const outcomes = (path: string[]) =>
    Object.fromEntries(
      consequencesResolvedAt(after(...path), 'd3-north-africa').map((c) => [c.consequenceId, c.triggered]),
    );

  it('landowners turn on the court only if legitimacy is below 28 by then', () => {
    expect(outcomes(['reform-taxation', 'hold-italy'])['tax-reform-landowners']).toBe(false); // legitimacy 29
    expect(outcomes(['reform-taxation', 'field-army'])['tax-reform-landowners']).toBe(true); // legitimacy 24
    expect(outcomes(['reform-taxation', 'settle-federates'])['tax-reform-landowners']).toBe(true); // legitimacy 17
    const lapsed = consequencesResolvedAt(after('reform-taxation', 'hold-italy'), 'd3-north-africa').find(
      (c) => c.consequenceId === 'tax-reform-landowners',
    )!;
    expect(lapsed.explanation).toMatch(/never turned into open opposition/);
    expect(lapsed.effects).toEqual([]);
  });

  it('provinces drift if Italy was garrisoned, unless they kept a share of revenue', () => {
    expect(outcomes(['reform-taxation', 'hold-italy'])['italy-provinces-drift']).toBe(true);
    expect(outcomes(['pay-the-armies', 'hold-italy'])['italy-provinces-drift']).toBe(true);
    expect(outcomes(['provincial-revenue', 'hold-italy'])['italy-provinces-drift']).toBe(false);
  });

  it('the field army earns its reputation only if Military is 55 or more by then', () => {
    expect(outcomes(['reform-taxation', 'field-army'])['field-army-victories']).toBe(true); // military 56
    expect(outcomes(['provincial-revenue', 'field-army'])['field-army-victories']).toBe(false); // military 53
  });

  it('unconditional 468 costs always land', () => {
    for (const second of D2) expect(outcomes(['provincial-revenue', second])['provincial-revenue-shortfall']).toBe(true);
    expect(outcomes(['reform-taxation', 'field-army'])['field-army-upkeep']).toBe(true);
    expect(outcomes(['provincial-revenue', 'field-army'])['field-army-upkeep']).toBe(true);
  });

  it('resolve in scheduling order, each checked against the state at that moment', () => {
    const resolved = consequencesResolvedAt(after('reform-taxation', 'field-army'), 'd3-north-africa');
    expect(resolved.map((c) => c.consequenceId)).toEqual([
      'tax-reform-landowners',
      'field-army-upkeep',
      'field-army-victories',
    ]);
    // Legitimacy 24 → 19 (landowners), then 19 → 23 (victories).
    expect(resolved[0]!.effects[0]).toEqual({ resource: 'legitimacy', requested: -5, applied: -5, before: 24, after: 19 });
    expect(resolved[2]!.effects[0]).toEqual({ resource: 'legitimacy', requested: 4, applied: 4, before: 19, after: 23 });
  });
});

describe('all 27 theoretical D1–D3 combinations', () => {
  it('match the independent reference model exactly', () => {
    const counts = { valid: 0, 'blocked-d2': 0, 'blocked-d3': 0 };
    for (const first of D1) {
      for (const second of D2) {
        for (const third of D3) {
          const key = `${first}/${second}/${third}`;
          const expected = MATRIX[key]!;
          counts[expected.status] += 1;

          const atD2 = after(first);
          const d2 = applyChoice(rome, atD2, second);
          if (expected.status === 'blocked-d2') {
            expect(d2.ok).toBe(false);
            if (!d2.ok) expect(d2.error).toBe('unavailable');
            continue;
          }
          expect(d2.ok).toBe(true);
          if (!d2.ok) continue;
          expect(d2.state.resources).toEqual(expected.atD3);

          const d3 = applyChoice(rome, d2.state, third);
          if (expected.status === 'blocked-d3') {
            expect(d3.ok).toBe(false);
            if (!d3.ok) expect(d3.error).toBe('unavailable');
            continue;
          }
          expect(d3.ok).toBe(true);
          if (!d3.ok) continue;
          const state = d3.state;
          expect(state.resources).toEqual(expected.final);
          expect(state.pending.map((p) => p.consequenceId)).toEqual(expected.pending);
          expect(state.currentEventId).toBe('checkpoint-d4');
          expect(state.year).toBe(471);
          expect(state.choicesMade).toEqual([first, second, third]);
          for (const key2 of RESOURCE_KEYS) {
            const value = state.resources[key2];
            expect(Number.isInteger(value) && value >= 0 && value <= 100).toBe(true);
          }
          // Everything still pending falls after the checkpoint.
          expect(state.pending.every((p) => p.dueYear > 471)).toBe(true);
        }
      }
    }
    expect(counts).toEqual({ valid: 21, 'blocked-d2': 3, 'blocked-d3': 3 });
    expect(enumeratePaths(rome)).toHaveLength(21);
  });

  it('explains each blocked combination in plain language', () => {
    const reason = (path: string[], choice: string) => {
      const result = applyChoice(rome, after(...path), choice);
      return result.ok ? 'ok' : result.message;
    };
    expect(reason(['pay-the-armies'], 'field-army')).toBe('Not available: Economy 30 or more (you have 25).');
    expect(reason(['reform-taxation', 'hold-italy'], 'join-expedition')).toBe(
      'Not available: Military 50 or more (you have 49).',
    );
    expect(reason(['provincial-revenue', 'hold-italy'], 'join-expedition')).toBe(
      'Not available: Military 50 or more (you have 49).',
    );
    expect(reason(['reform-taxation', 'settle-federates'], 'treaty-with-gaiseric')).toBe(
      'Not available: Legitimacy 15 or more (you have 12).',
    );
  });

  it('decision 2 shapes decision 3', () => {
    const options = (...path: string[]) =>
      Object.fromEntries(evaluateChoices(rome, after(...path)).map((e) => [e.choice.id, e]));
    const ids = (path: string[], choice: string) => options(...path)[choice]!.applicableConditionals.map((c) => c.id);
    expect(ids(['reform-taxation', 'field-army'], 'join-expedition')).toEqual(['expedition-veterans']);
    expect(ids(['pay-the-armies', 'hold-italy'], 'join-expedition')).toEqual(['expedition-islands']);
    expect(ids(['pay-the-armies', 'hold-italy'], 'treaty-with-gaiseric')).toEqual(['treaty-garrisoned-coasts']);
    expect(ids(['reform-taxation', 'field-army'], 'fortify-what-remains')).toEqual(['fortify-field-army']);
    expect(ids(['pay-the-armies', 'settle-federates'], 'fortify-what-remains')).toEqual(['fortify-federates']);
    expect(options('reform-taxation', 'hold-italy')['join-expedition']!.available).toBe(false);
  });

  it('no decision 3 option is better than another on every resource, from any starting point', () => {
    for (const first of D1) {
      for (const second of D2) {
        const d2 = applyChoice(rome, after(first), second);
        if (!d2.ok) continue;
        const outcomes = evaluateChoices(rome, d2.state)
          .filter((e) => e.available)
          .map((e) => replay(rome, [first, second, e.choice.id]).resources);
        for (const a of outcomes) {
          for (const b of outcomes) {
            if (a === b) continue;
            expect(RESOURCE_KEYS.every((key) => a[key] >= b[key])).toBe(false);
          }
        }
      }
    }
  });

  it('is deterministic and leaves actual history untouched', () => {
    const before = JSON.stringify(romeActualTimeline);
    for (const path of enumeratePaths(rome)) {
      expect(JSON.stringify(replay(rome, path))).toBe(JSON.stringify(replay(rome, path)));
    }
    expect(JSON.stringify(romeActualTimeline)).toBe(before);
  });

  it('is decision 3 of 5, c. 468', () => {
    const state = after('pay-the-armies', 'hold-italy');
    expect(decisionNumber(rome, getCurrentNode(rome, state).id)).toBe(3);
  });
});

describe('decision 3 narrative reports', () => {
  const report = (path: string[]) => replay(rome, path).records.at(-1)!.narrative!;

  it('is chosen from the state before the choice, so the same path always reads the same', () => {
    for (const path of enumeratePaths(rome)) {
      expect(JSON.stringify(replay(rome, path).records.at(-1)!.narrative)).toBe(
        JSON.stringify(replay(rome, path).records.at(-1)!.narrative),
      );
      expect(replay(rome, path).records.at(-1)!.narrative).toBeTruthy();
    }
  });

  it('uses the variant text that matches the empire’s situation', () => {
    expect(report(['pay-the-armies', 'hold-italy', 'join-expedition']).effect).toMatch(/secured the islands/); // military 67
    expect(report(['provincial-revenue', 'field-army', 'join-expedition']).effect).not.toMatch(/secured the islands/); // military 53
    expect(report(['pay-the-armies', 'hold-italy', 'treaty-with-gaiseric']).effect).toMatch(/Garrisoned coasts/);
    expect(report(['reform-taxation', 'field-army', 'treaty-with-gaiseric']).effect).not.toMatch(/Garrisoned coasts/);
    expect(report(['reform-taxation', 'field-army', 'fortify-what-remains']).effect).toMatch(/field army, stationed/);
  });

  it('only lists conditional groups when their condition holds', () => {
    const groups = (path: string[]) => report(path).stakeholders.map((s) => s.id);
    expect(groups(['reform-taxation', 'field-army', 'join-expedition'])).toContain('veterans');
    expect(groups(['pay-the-armies', 'hold-italy', 'join-expedition'])).not.toContain('veterans');
    expect(groups(['pay-the-armies', 'settle-federates', 'fortify-what-remains'])).toContain('federates');
    expect(groups(['pay-the-armies', 'hold-italy', 'fortify-what-remains'])).not.toContain('federates');
  });

  it('every report says what was ordered, who gains and loses, and what is uncertain', () => {
    for (const path of enumeratePaths(rome)) {
      const n = report(path);
      expect(n.ordered).toMatch(/^You /);
      expect(n.effect.length).toBeGreaterThan(40);
      expect(n.stakeholders.some((s) => s.impact === 'gains')).toBe(true);
      expect(n.stakeholders.some((s) => s.impact === 'loses')).toBe(true);
      expect(n.uncertainty.length).toBeGreaterThan(40);
    }
  });
});
