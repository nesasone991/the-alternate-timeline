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
const D4 = ['restore-imperial-authority', 'bargain-with-regions', 'rule-through-commander'] as const;

const R = (economy: number, military: number, unity: number, legitimacy: number): Resources => ({
  economy,
  military,
  unity,
  legitimacy,
});

type Expected =
  | { status: 'valid'; atD3: Resources; atD4: Resources; final: Resources; pending: string[] }
  | { status: 'blocked-d2' }
  | { status: 'blocked-d3'; atD3: Resources }
  | { status: 'blocked-d4'; atD3: Resources; atD4: Resources; reason: string };

/**
 * Expected outcome of every theoretical D1 × D2 × D3 × D4 combination, resources
 * as (economy, military, unity, legitimacy). Produced by an independent
 * reference model of the rules (a separate Python calculation, not this
 * engine), then pasted here. `atD3` / `atD4` are the states when those
 * decisions are shown — i.e. AFTER the consequences due in 468 / 472 have
 * taken effect. `final` is the state at the c. 474 checkpoint.
 */
const MATRIX: Record<string, Expected> = {
  'reform-taxation/hold-italy/join-expedition/restore-imperial-authority': { status: 'blocked-d3', atD3: R(56, 49, 17, 29) },
  'reform-taxation/hold-italy/join-expedition/bargain-with-regions': { status: 'blocked-d3', atD3: R(56, 49, 17, 29) },
  'reform-taxation/hold-italy/join-expedition/rule-through-commander': { status: 'blocked-d3', atD3: R(56, 49, 17, 29) },
  'reform-taxation/hold-italy/treaty-with-gaiseric/restore-imperial-authority': { status: 'valid', atD3: R(56, 49, 17, 29), atD4: R(68, 49, 19, 17), final: R(73, 45, 12, 22), pending: ["loyal-administration", "centralisation-resisted"] },
  'reform-taxation/hold-italy/treaty-with-gaiseric/bargain-with-regions': { status: 'valid', atD3: R(56, 49, 17, 29), atD4: R(68, 49, 19, 17), final: R(62, 47, 25, 21), pending: ["regional-levies", "bargain-strains"] },
  'reform-taxation/hold-italy/treaty-with-gaiseric/rule-through-commander': { status: 'blocked-d4', atD3: R(56, 49, 17, 29), atD4: R(68, 49, 19, 17), reason: 'Not available: Military 50 or more (you have 49).' },
  'reform-taxation/hold-italy/fortify-what-remains/restore-imperial-authority': { status: 'valid', atD3: R(56, 49, 17, 29), atD4: R(50, 52, 23, 25), final: R(55, 48, 16, 33), pending: ["sea-left-to-vandals", "loyal-administration", "centralisation-resisted"] },
  'reform-taxation/hold-italy/fortify-what-remains/bargain-with-regions': { status: 'valid', atD3: R(56, 49, 17, 29), atD4: R(50, 52, 23, 25), final: R(44, 50, 32, 29), pending: ["sea-left-to-vandals", "regional-levies", "bargain-strains"] },
  'reform-taxation/hold-italy/fortify-what-remains/rule-through-commander': { status: 'valid', atD3: R(56, 49, 17, 29), atD4: R(50, 52, 23, 25), final: R(45, 58, 27, 17), pending: ["sea-left-to-vandals", "commander-ambition", "army-arrears"] },
  'reform-taxation/field-army/join-expedition/restore-imperial-authority': { status: 'valid', atD3: R(41, 56, 35, 23), atD4: R(24, 54, 35, 29), final: R(29, 50, 28, 40), pending: ["expedition-reprisal", "loyal-administration", "centralisation-resisted"] },
  'reform-taxation/field-army/join-expedition/bargain-with-regions': { status: 'valid', atD3: R(41, 56, 35, 23), atD4: R(24, 54, 35, 29), final: R(18, 52, 41, 33), pending: ["expedition-reprisal", "regional-levies", "bargain-strains"] },
  'reform-taxation/field-army/join-expedition/rule-through-commander': { status: 'valid', atD3: R(41, 56, 35, 23), atD4: R(24, 54, 35, 29), final: R(19, 63, 39, 21), pending: ["expedition-reprisal", "commander-ambition", "army-arrears"] },
  'reform-taxation/field-army/treaty-with-gaiseric/restore-imperial-authority': { status: 'blocked-d4', atD3: R(41, 56, 35, 23), atD4: R(53, 56, 37, 11), reason: 'Not available: Legitimacy 15 or more (you have 11).' },
  'reform-taxation/field-army/treaty-with-gaiseric/bargain-with-regions': { status: 'valid', atD3: R(41, 56, 35, 23), atD4: R(53, 56, 37, 11), final: R(47, 54, 43, 19), pending: ["regional-levies", "bargain-strains"] },
  'reform-taxation/field-army/treaty-with-gaiseric/rule-through-commander': { status: 'valid', atD3: R(41, 56, 35, 23), atD4: R(53, 56, 37, 11), final: R(48, 68, 41, 3), pending: ["commander-ambition", "army-arrears"] },
  'reform-taxation/field-army/fortify-what-remains/restore-imperial-authority': { status: 'valid', atD3: R(41, 56, 35, 23), atD4: R(35, 59, 44, 19), final: R(40, 55, 37, 27), pending: ["sea-left-to-vandals", "loyal-administration", "centralisation-resisted"] },
  'reform-taxation/field-army/fortify-what-remains/bargain-with-regions': { status: 'valid', atD3: R(41, 56, 35, 23), atD4: R(35, 59, 44, 19), final: R(29, 57, 53, 23), pending: ["sea-left-to-vandals", "regional-levies", "bargain-strains"] },
  'reform-taxation/field-army/fortify-what-remains/rule-through-commander': { status: 'valid', atD3: R(41, 56, 35, 23), atD4: R(35, 59, 44, 19), final: R(30, 68, 48, 11), pending: ["sea-left-to-vandals", "commander-ambition", "army-arrears"] },
  'reform-taxation/settle-federates/join-expedition/restore-imperial-authority': { status: 'valid', atD3: R(59, 52, 31, 12), atD4: R(42, 46, 31, 18), final: R(47, 42, 24, 29), pending: ["federates-demands", "expedition-reprisal", "loyal-administration", "centralisation-resisted"] },
  'reform-taxation/settle-federates/join-expedition/bargain-with-regions': { status: 'valid', atD3: R(59, 52, 31, 12), atD4: R(42, 46, 31, 18), final: R(36, 44, 37, 22), pending: ["federates-demands", "expedition-reprisal", "regional-levies", "bargain-strains"] },
  'reform-taxation/settle-federates/join-expedition/rule-through-commander': { status: 'blocked-d4', atD3: R(59, 52, 31, 12), atD4: R(42, 46, 31, 18), reason: 'Not available: Military 50 or more (you have 46).' },
  'reform-taxation/settle-federates/treaty-with-gaiseric/restore-imperial-authority': { status: 'blocked-d3', atD3: R(59, 52, 31, 12) },
  'reform-taxation/settle-federates/treaty-with-gaiseric/bargain-with-regions': { status: 'blocked-d3', atD3: R(59, 52, 31, 12) },
  'reform-taxation/settle-federates/treaty-with-gaiseric/rule-through-commander': { status: 'blocked-d3', atD3: R(59, 52, 31, 12) },
  'reform-taxation/settle-federates/fortify-what-remains/restore-imperial-authority': { status: 'blocked-d4', atD3: R(59, 52, 31, 12), atD4: R(53, 58, 37, 8), reason: 'Not available: Legitimacy 15 or more (you have 8).' },
  'reform-taxation/settle-federates/fortify-what-remains/bargain-with-regions': { status: 'valid', atD3: R(59, 52, 31, 12), atD4: R(53, 58, 37, 8), final: R(47, 56, 46, 16), pending: ["federates-demands", "sea-left-to-vandals", "regional-levies", "bargain-strains"] },
  'reform-taxation/settle-federates/fortify-what-remains/rule-through-commander': { status: 'valid', atD3: R(59, 52, 31, 12), atD4: R(53, 58, 37, 8), final: R(48, 64, 41, 0), pending: ["federates-demands", "sea-left-to-vandals", "commander-ambition", "army-arrears"] },
  'provincial-revenue/hold-italy/join-expedition/restore-imperial-authority': { status: 'blocked-d3', atD3: R(28, 49, 37, 32) },
  'provincial-revenue/hold-italy/join-expedition/bargain-with-regions': { status: 'blocked-d3', atD3: R(28, 49, 37, 32) },
  'provincial-revenue/hold-italy/join-expedition/rule-through-commander': { status: 'blocked-d3', atD3: R(28, 49, 37, 32) },
  'provincial-revenue/hold-italy/treaty-with-gaiseric/restore-imperial-authority': { status: 'valid', atD3: R(28, 49, 37, 32), atD4: R(40, 49, 39, 20), final: R(45, 45, 32, 25), pending: ["loyal-administration", "centralisation-resisted"] },
  'provincial-revenue/hold-italy/treaty-with-gaiseric/bargain-with-regions': { status: 'valid', atD3: R(28, 49, 37, 32), atD4: R(40, 49, 39, 20), final: R(34, 47, 45, 24), pending: ["regional-levies", "bargain-strains"] },
  'provincial-revenue/hold-italy/treaty-with-gaiseric/rule-through-commander': { status: 'blocked-d4', atD3: R(28, 49, 37, 32), atD4: R(40, 49, 39, 20), reason: 'Not available: Military 50 or more (you have 49).' },
  'provincial-revenue/hold-italy/fortify-what-remains/restore-imperial-authority': { status: 'valid', atD3: R(28, 49, 37, 32), atD4: R(22, 52, 43, 28), final: R(27, 48, 36, 36), pending: ["sea-left-to-vandals", "loyal-administration", "centralisation-resisted"] },
  'provincial-revenue/hold-italy/fortify-what-remains/bargain-with-regions': { status: 'valid', atD3: R(28, 49, 37, 32), atD4: R(22, 52, 43, 28), final: R(16, 50, 52, 32), pending: ["sea-left-to-vandals", "regional-levies", "bargain-strains"] },
  'provincial-revenue/hold-italy/fortify-what-remains/rule-through-commander': { status: 'valid', atD3: R(28, 49, 37, 32), atD4: R(22, 52, 43, 28), final: R(17, 58, 47, 20), pending: ["sea-left-to-vandals", "commander-ambition", "army-arrears"] },
  'provincial-revenue/field-army/join-expedition/restore-imperial-authority': { status: 'blocked-d4', atD3: R(13, 53, 49, 27), atD4: R(0, 51, 49, 33), reason: 'Not available: Economy 10 or more (you have 0).' },
  'provincial-revenue/field-army/join-expedition/bargain-with-regions': { status: 'valid', atD3: R(13, 53, 49, 27), atD4: R(0, 51, 49, 33), final: R(10, 49, 55, 37), pending: ["expedition-reprisal", "regional-levies", "bargain-strains"] },
  'provincial-revenue/field-army/join-expedition/rule-through-commander': { status: 'valid', atD3: R(13, 53, 49, 27), atD4: R(0, 51, 49, 33), final: R(0, 60, 53, 25), pending: ["expedition-reprisal", "commander-ambition", "army-arrears"] },
  'provincial-revenue/field-army/treaty-with-gaiseric/restore-imperial-authority': { status: 'valid', atD3: R(13, 53, 49, 27), atD4: R(25, 53, 51, 15), final: R(30, 49, 44, 20), pending: ["loyal-administration", "centralisation-resisted"] },
  'provincial-revenue/field-army/treaty-with-gaiseric/bargain-with-regions': { status: 'valid', atD3: R(13, 53, 49, 27), atD4: R(25, 53, 51, 15), final: R(19, 51, 57, 19), pending: ["regional-levies", "bargain-strains"] },
  'provincial-revenue/field-army/treaty-with-gaiseric/rule-through-commander': { status: 'valid', atD3: R(13, 53, 49, 27), atD4: R(25, 53, 51, 15), final: R(20, 65, 55, 7), pending: ["commander-ambition", "army-arrears"] },
  'provincial-revenue/field-army/fortify-what-remains/restore-imperial-authority': { status: 'blocked-d4', atD3: R(13, 53, 49, 27), atD4: R(7, 56, 58, 23), reason: 'Not available: Economy 10 or more (you have 7).' },
  'provincial-revenue/field-army/fortify-what-remains/bargain-with-regions': { status: 'valid', atD3: R(13, 53, 49, 27), atD4: R(7, 56, 58, 23), final: R(11, 54, 67, 27), pending: ["sea-left-to-vandals", "regional-levies", "bargain-strains"] },
  'provincial-revenue/field-army/fortify-what-remains/rule-through-commander': { status: 'valid', atD3: R(13, 53, 49, 27), atD4: R(7, 56, 58, 23), final: R(2, 65, 62, 15), pending: ["sea-left-to-vandals", "commander-ambition", "army-arrears"] },
  'provincial-revenue/settle-federates/join-expedition/restore-imperial-authority': { status: 'valid', atD3: R(31, 52, 49, 20), atD4: R(14, 46, 49, 26), final: R(19, 42, 42, 37), pending: ["federates-demands", "expedition-reprisal", "loyal-administration", "centralisation-resisted"] },
  'provincial-revenue/settle-federates/join-expedition/bargain-with-regions': { status: 'valid', atD3: R(31, 52, 49, 20), atD4: R(14, 46, 49, 26), final: R(18, 44, 55, 30), pending: ["federates-demands", "expedition-reprisal", "regional-levies", "bargain-strains"] },
  'provincial-revenue/settle-federates/join-expedition/rule-through-commander': { status: 'blocked-d4', atD3: R(31, 52, 49, 20), atD4: R(14, 46, 49, 26), reason: 'Not available: Military 50 or more (you have 46).' },
  'provincial-revenue/settle-federates/treaty-with-gaiseric/restore-imperial-authority': { status: 'blocked-d4', atD3: R(31, 52, 49, 20), atD4: R(43, 52, 51, 8), reason: 'Not available: Legitimacy 15 or more (you have 8).' },
  'provincial-revenue/settle-federates/treaty-with-gaiseric/bargain-with-regions': { status: 'valid', atD3: R(31, 52, 49, 20), atD4: R(43, 52, 51, 8), final: R(37, 50, 57, 16), pending: ["federates-demands", "regional-levies", "bargain-strains"] },
  'provincial-revenue/settle-federates/treaty-with-gaiseric/rule-through-commander': { status: 'valid', atD3: R(31, 52, 49, 20), atD4: R(43, 52, 51, 8), final: R(38, 61, 55, 0), pending: ["federates-demands", "commander-ambition", "army-arrears"] },
  'provincial-revenue/settle-federates/fortify-what-remains/restore-imperial-authority': { status: 'valid', atD3: R(31, 52, 49, 20), atD4: R(25, 58, 55, 16), final: R(30, 54, 48, 24), pending: ["federates-demands", "sea-left-to-vandals", "loyal-administration", "centralisation-resisted"] },
  'provincial-revenue/settle-federates/fortify-what-remains/bargain-with-regions': { status: 'valid', atD3: R(31, 52, 49, 20), atD4: R(25, 58, 55, 16), final: R(19, 56, 64, 20), pending: ["federates-demands", "sea-left-to-vandals", "regional-levies", "bargain-strains"] },
  'provincial-revenue/settle-federates/fortify-what-remains/rule-through-commander': { status: 'valid', atD3: R(31, 52, 49, 20), atD4: R(25, 58, 55, 16), final: R(20, 64, 59, 8), pending: ["federates-demands", "sea-left-to-vandals", "commander-ambition", "army-arrears"] },
  'pay-the-armies/hold-italy/join-expedition/restore-imperial-authority': { status: 'valid', atD3: R(25, 67, 21, 39), atD4: R(13, 61, 21, 45), final: R(18, 57, 14, 56), pending: ["expedition-reprisal", "loyal-administration", "centralisation-resisted"] },
  'pay-the-armies/hold-italy/join-expedition/bargain-with-regions': { status: 'valid', atD3: R(25, 67, 21, 39), atD4: R(13, 61, 21, 45), final: R(17, 59, 27, 49), pending: ["expedition-reprisal", "regional-levies", "bargain-strains"] },
  'pay-the-armies/hold-italy/join-expedition/rule-through-commander': { status: 'valid', atD3: R(25, 67, 21, 39), atD4: R(13, 61, 21, 45), final: R(8, 67, 25, 37), pending: ["expedition-reprisal", "commander-ambition", "army-arrears"] },
  'pay-the-armies/hold-italy/treaty-with-gaiseric/restore-imperial-authority': { status: 'valid', atD3: R(25, 67, 21, 39), atD4: R(41, 67, 23, 27), final: R(46, 63, 16, 32), pending: ["loyal-administration", "centralisation-resisted"] },
  'pay-the-armies/hold-italy/treaty-with-gaiseric/bargain-with-regions': { status: 'valid', atD3: R(25, 67, 21, 39), atD4: R(41, 67, 23, 27), final: R(35, 65, 29, 31), pending: ["regional-levies", "bargain-strains"] },
  'pay-the-armies/hold-italy/treaty-with-gaiseric/rule-through-commander': { status: 'valid', atD3: R(25, 67, 21, 39), atD4: R(41, 67, 23, 27), final: R(36, 76, 27, 19), pending: ["commander-ambition", "army-arrears"] },
  'pay-the-armies/hold-italy/fortify-what-remains/restore-imperial-authority': { status: 'valid', atD3: R(25, 67, 21, 39), atD4: R(19, 70, 27, 35), final: R(24, 66, 20, 43), pending: ["sea-left-to-vandals", "loyal-administration", "centralisation-resisted"] },
  'pay-the-armies/hold-italy/fortify-what-remains/bargain-with-regions': { status: 'valid', atD3: R(25, 67, 21, 39), atD4: R(19, 70, 27, 35), final: R(13, 68, 36, 39), pending: ["sea-left-to-vandals", "regional-levies", "bargain-strains"] },
  'pay-the-armies/hold-italy/fortify-what-remains/rule-through-commander': { status: 'valid', atD3: R(25, 67, 21, 39), atD4: R(19, 70, 27, 35), final: R(14, 76, 31, 27), pending: ["sea-left-to-vandals", "commander-ambition", "army-arrears"] },
  'pay-the-armies/field-army/join-expedition/restore-imperial-authority': { status: 'blocked-d2' },
  'pay-the-armies/field-army/join-expedition/bargain-with-regions': { status: 'blocked-d2' },
  'pay-the-armies/field-army/join-expedition/rule-through-commander': { status: 'blocked-d2' },
  'pay-the-armies/field-army/treaty-with-gaiseric/restore-imperial-authority': { status: 'blocked-d2' },
  'pay-the-armies/field-army/treaty-with-gaiseric/bargain-with-regions': { status: 'blocked-d2' },
  'pay-the-armies/field-army/treaty-with-gaiseric/rule-through-commander': { status: 'blocked-d2' },
  'pay-the-armies/field-army/fortify-what-remains/restore-imperial-authority': { status: 'blocked-d2' },
  'pay-the-armies/field-army/fortify-what-remains/bargain-with-regions': { status: 'blocked-d2' },
  'pay-the-armies/field-army/fortify-what-remains/rule-through-commander': { status: 'blocked-d2' },
  'pay-the-armies/settle-federates/join-expedition/restore-imperial-authority': { status: 'valid', atD3: R(28, 66, 35, 27), atD4: R(16, 60, 35, 33), final: R(21, 56, 28, 44), pending: ["federates-demands", "expedition-reprisal", "loyal-administration", "centralisation-resisted"] },
  'pay-the-armies/settle-federates/join-expedition/bargain-with-regions': { status: 'valid', atD3: R(28, 66, 35, 27), atD4: R(16, 60, 35, 33), final: R(10, 58, 41, 37), pending: ["federates-demands", "expedition-reprisal", "regional-levies", "bargain-strains"] },
  'pay-the-armies/settle-federates/join-expedition/rule-through-commander': { status: 'valid', atD3: R(28, 66, 35, 27), atD4: R(16, 60, 35, 33), final: R(11, 66, 39, 25), pending: ["federates-demands", "expedition-reprisal", "commander-ambition", "army-arrears"] },
  'pay-the-armies/settle-federates/treaty-with-gaiseric/restore-imperial-authority': { status: 'valid', atD3: R(28, 66, 35, 27), atD4: R(40, 66, 37, 15), final: R(45, 62, 30, 20), pending: ["federates-demands", "loyal-administration", "centralisation-resisted"] },
  'pay-the-armies/settle-federates/treaty-with-gaiseric/bargain-with-regions': { status: 'valid', atD3: R(28, 66, 35, 27), atD4: R(40, 66, 37, 15), final: R(34, 64, 43, 19), pending: ["federates-demands", "regional-levies", "bargain-strains"] },
  'pay-the-armies/settle-federates/treaty-with-gaiseric/rule-through-commander': { status: 'valid', atD3: R(28, 66, 35, 27), atD4: R(40, 66, 37, 15), final: R(35, 75, 41, 7), pending: ["federates-demands", "commander-ambition", "army-arrears"] },
  'pay-the-armies/settle-federates/fortify-what-remains/restore-imperial-authority': { status: 'valid', atD3: R(28, 66, 35, 27), atD4: R(22, 72, 41, 23), final: R(27, 68, 34, 31), pending: ["federates-demands", "sea-left-to-vandals", "loyal-administration", "centralisation-resisted"] },
  'pay-the-armies/settle-federates/fortify-what-remains/bargain-with-regions': { status: 'valid', atD3: R(28, 66, 35, 27), atD4: R(22, 72, 41, 23), final: R(16, 70, 50, 27), pending: ["federates-demands", "sea-left-to-vandals", "regional-levies", "bargain-strains"] },
  'pay-the-armies/settle-federates/fortify-what-remains/rule-through-commander': { status: 'valid', atD3: R(28, 66, 35, 27), atD4: R(22, 72, 41, 23), final: R(17, 78, 45, 15), pending: ["federates-demands", "sea-left-to-vandals", "commander-ambition", "army-arrears"] },
};

function after(...choices: string[]): SimulationState {
  return replay(rome, choices);
}

/** Every distinct valid D1–D3 prefix. */
function d3Paths(): string[][] {
  const seen = new Set<string>();
  return enumeratePaths(rome)
    .map((path) => path.slice(0, 3))
    .filter((path) => {
      const key = path.join('/');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function decision(id: string) {
  const node = rome.nodes.find((item) => item.id === id);
  if (node?.kind !== 'decision') throw new Error(`no decision ${id}`);
  return node;
}

describe('Rome scenario integrity', () => {
  it('passes the validator, including links to real event ids', () => {
    expect(validateScenario(rome, actualIds)).toEqual([]);
  });

  it('is version 4, with a change note for every version', () => {
    expect(rome.version).toBe(4);
    expect(rome.changes.map((change) => change.version)).toEqual([1, 2, 3, 4]);
    expect(createInitialState(rome).scenarioVersion).toBe(4);
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

  it('every decision 3 option has a later consequence and a full narrative', () => {
    const d3 = decision('d3-north-africa');
    expect(d3.choices.map((c) => c.id)).toEqual([...D3]);
    for (const choice of d3.choices) {
      expect((choice.consequences ?? []).length).toBeGreaterThan(0);
      const n = choice.narrative!;
      expect(n.ordered).toMatch(/^You /);
      expect(n.stakeholders.some((s) => s.impact === 'gains' && !s.when)).toBe(true);
      expect(n.stakeholders.some((s) => s.impact === 'loses' && !s.when)).toBe(true);
      expect(n.uncertainty.length).toBeGreaterThan(40);
    }
    expect(d3.choices.filter((c) => (c.prerequisites ?? []).length > 0).map((c) => c.id)).toEqual([
      'join-expedition',
      'treaty-with-gaiseric',
    ]);
  });

  it('decision 4 is c. 472, set against the sourced 467–472 events, with three complete options', () => {
    const d4 = decision('d4-imperial-legitimacy');
    expect(d4.year).toBe(472);
    expect(d4.historicalContextIds).toEqual([
      'anthemius-467',
      'gaul-defeat-471',
      'ricimer-overthrows-anthemius-472',
      'ricimer-olybrius-die-472',
    ]);
    expect(d4.choices.map((c) => c.id)).toEqual([...D4]);
    for (const choice of d4.choices) {
      expect((choice.consequences ?? []).length).toBe(2);
      expect(choice.consequences!.every((c) => c.dueYear > 474)).toBe(true);
      const n = choice.narrative!;
      expect(n.situation?.length).toBeGreaterThan(40);
      expect(n.ordered).toMatch(/^You /);
      expect(n.uncertainty.length).toBeGreaterThan(40);
    }
    // Restoring authority and ruling through the commander are gated; the bargain is always open.
    expect(d4.choices.map((c) => (c.prerequisites ?? []).length)).toEqual([2, 0, 1]);
  });

  it('every decision 4 option reacts to decision 3', () => {
    const d3Flags = new Set(['joined-expedition', 'vandal-treaty', 'africa-abandoned']);
    for (const choice of decision('d4-imperial-legitimacy').choices) {
      const reacts = (choice.conditionalEffects ?? []).some((c) => {
        const flag = 'flag' in c.when ? c.when.flag : undefined;
        return flag !== undefined && d3Flags.has(flag);
      });
      expect(reacts).toBe(true);
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

  it('ends every path at the decision 5 checkpoint, c. 474', () => {
    const end = rome.nodes.find((node) => node.id === 'checkpoint-d5');
    expect(end?.kind).toBe('terminal');
    expect(end?.year).toBe(474);
    expect(rome.nodes.some((node) => node.id === 'checkpoint-d4')).toBe(false);
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

describe('the consequences due in 472', () => {
  it('resolve on arrival at decision 4, before the player decides', () => {
    for (const prefix of d3Paths()) {
      const state = after(...prefix);
      expect(state.currentEventId).toBe('d4-imperial-legitimacy');
      expect(state.year).toBe(472);
      expect(state.pending.filter((p) => p.dueYear <= 472)).toEqual([]);
      for (const item of consequencesResolvedAt(state, 'd4-imperial-legitimacy')) {
        expect(item.resolvedYear).toBe(472);
        expect(item.dueYear).toBe(472);
      }
    }
  });

  const resolved = (path: string[]) => consequencesResolvedAt(after(...path), 'd4-imperial-legitimacy');

  it('the treaty holds only if Military is 50 or more by then', () => {
    const lapsed = resolved(['reform-taxation', 'hold-italy', 'treaty-with-gaiseric']).find((c) => c.consequenceId === 'treaty-holds')!;
    expect(lapsed.triggered).toBe(false); // military 49
    expect(lapsed.effects).toEqual([]);
    expect(lapsed.explanation).toMatch(/soon ignored the treaty/);
    const held = resolved(['pay-the-armies', 'hold-italy', 'treaty-with-gaiseric']).find((c) => c.consequenceId === 'treaty-holds')!;
    expect(held.triggered).toBe(true); // military 67
    expect(held.effects[0]).toEqual({ resource: 'economy', requested: 4, applied: 4, before: 37, after: 41 });
  });

  it('unconditional 472 costs always land, in scheduling order', () => {
    expect(resolved(['provincial-revenue', 'hold-italy', 'treaty-with-gaiseric']).map((c) => [c.consequenceId, c.triggered])).toEqual([
      ['treaty-eastern-resentment', true],
      ['treaty-holds', false],
    ]);
    for (const prefix of d3Paths().filter((p) => p[2] === 'join-expedition')) {
      expect(resolved(prefix).map((c) => [c.consequenceId, c.triggered])).toEqual([['expedition-debts', true]]);
    }
  });

  it('a cost that would push a resource below zero is capped, and the record says so', () => {
    const debts = resolved(['provincial-revenue', 'field-army', 'join-expedition'])[0]!;
    expect(debts.effects[0]).toEqual({ resource: 'economy', requested: -5, applied: -1, before: 1, after: 0 });
  });

  it('nothing is due in 472 after giving up Africa', () => {
    for (const prefix of d3Paths().filter((p) => p[2] === 'fortify-what-remains')) expect(resolved(prefix)).toEqual([]);
  });
});

describe('all 81 theoretical D1–D4 combinations', () => {
  it('match the independent reference model exactly', () => {
    const counts = { valid: 0, 'blocked-d2': 0, 'blocked-d3': 0, 'blocked-d4': 0 };
    for (const first of D1) {
      for (const second of D2) {
        for (const third of D3) {
          for (const fourth of D4) {
            const key = `${first}/${second}/${third}/${fourth}`;
            const expected = MATRIX[key]!;
            counts[expected.status] += 1;

            const d2 = applyChoice(rome, after(first), second);
            if (expected.status === 'blocked-d2') {
              expect(d2.ok).toBe(false);
              if (!d2.ok) expect(d2.error).toBe('unavailable');
              continue;
            }
            if (!d2.ok) throw new Error(`${key}: decision 2 rejected`);
            expect(d2.state.resources).toEqual(expected.atD3);

            const d3 = applyChoice(rome, d2.state, third);
            if (expected.status === 'blocked-d3') {
              expect(d3.ok).toBe(false);
              continue;
            }
            if (!d3.ok) throw new Error(`${key}: decision 3 rejected`);
            expect(d3.state.resources).toEqual(expected.atD4);

            const d4 = applyChoice(rome, d3.state, fourth);
            if (expected.status === 'blocked-d4') {
              expect(d4.ok).toBe(false);
              if (!d4.ok) {
                expect(d4.error).toBe('unavailable');
                expect(d4.message).toBe(expected.reason);
              }
              continue;
            }
            if (!d4.ok) throw new Error(`${key}: decision 4 rejected`);
            const state = d4.state;
            expect(state.resources).toEqual(expected.final);
            expect(state.pending.map((p) => p.consequenceId)).toEqual(expected.pending);
            expect(state.currentEventId).toBe('checkpoint-d5');
            expect(state.year).toBe(474);
            expect(state.choicesMade).toEqual([first, second, third, fourth]);
            for (const resource of RESOURCE_KEYS) {
              const value = state.resources[resource];
              expect(Number.isInteger(value) && value >= 0 && value <= 100).toBe(true);
            }
            expect(state.pending.every((p) => p.dueYear > 474)).toBe(true);
            expect(state.records).toHaveLength(4);
          }
        }
      }
    }
    expect(counts).toEqual({ valid: 54, 'blocked-d2': 9, 'blocked-d3': 9, 'blocked-d4': 9 });
    expect(enumeratePaths(rome)).toHaveLength(54);
  });

  it('every state that reaches decision 4 has at least two options, and the bargain is always one', () => {
    const prefixes = d3Paths();
    expect(prefixes).toHaveLength(21);
    for (const prefix of prefixes) {
      const options = evaluateChoices(rome, after(...prefix));
      expect(options.filter((o) => o.available).length).toBeGreaterThanOrEqual(2);
      expect(options.find((o) => o.choice.id === 'bargain-with-regions')!.available).toBe(true);
    }
  });

  it('explains blocked decision 2 and 3 combinations in plain language', () => {
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
  });

  it('decision 3 shapes decision 4', () => {
    const ids = (path: string[], choice: string) =>
      evaluateChoices(rome, after(...path))
        .find((e) => e.choice.id === choice)!
        .applicableConditionals.map((c) => c.id);
    expect(ids(['pay-the-armies', 'hold-italy', 'join-expedition'], 'restore-imperial-authority')).toEqual([
      'authority-eastern-backing',
    ]);
    expect(ids(['pay-the-armies', 'hold-italy', 'treaty-with-gaiseric'], 'restore-imperial-authority')).toEqual([
      'authority-eastern-doubts',
    ]);
    expect(ids(['pay-the-armies', 'hold-italy', 'treaty-with-gaiseric'], 'rule-through-commander')).toEqual([
      'commander-quiet-sea',
    ]);
    expect(ids(['pay-the-armies', 'hold-italy', 'fortify-what-remains'], 'bargain-with-regions')).toEqual([
      'bargain-loyal-provinces',
    ]);
    expect(ids(['pay-the-armies', 'hold-italy', 'join-expedition'], 'bargain-with-regions')).toEqual(['bargain-landowner-loans']);
  });

  it('no option at decision 3 or 4 is better than another on every resource, from any starting point', () => {
    const dominated = (states: Resources[]) =>
      states.some((a, i) => states.some((b, j) => i !== j && RESOURCE_KEYS.every((key) => a[key] >= b[key])));
    for (const first of D1) {
      for (const second of D2) {
        const d2 = applyChoice(rome, after(first), second);
        if (!d2.ok) continue;
        const atD4 = evaluateChoices(rome, d2.state)
          .filter((e) => e.available)
          .map((e) => after(first, second, e.choice.id).resources);
        expect(dominated(atD4)).toBe(false);
      }
    }
    for (const prefix of d3Paths()) {
      const finals = evaluateChoices(rome, after(...prefix))
        .filter((e) => e.available)
        .map((e) => after(...prefix, e.choice.id).resources);
      expect(dominated(finals)).toBe(false);
    }
  });

  it('is deterministic and leaves actual history untouched', () => {
    const before = JSON.stringify(romeActualTimeline);
    for (const path of enumeratePaths(rome)) {
      expect(JSON.stringify(replay(rome, path))).toBe(JSON.stringify(replay(rome, path)));
    }
    expect(JSON.stringify(romeActualTimeline)).toBe(before);
  });

  it('numbers decisions 3 and 4 of 5', () => {
    expect(decisionNumber(rome, getCurrentNode(rome, after('pay-the-armies', 'hold-italy')).id)).toBe(3);
    expect(decisionNumber(rome, getCurrentNode(rome, after('pay-the-armies', 'hold-italy', 'join-expedition')).id)).toBe(4);
  });
});

describe('recovery from severely weakened states at decision 4', () => {
  it('an empty treasury (Economy 0): the bargain brings loans at a real cost; central authority is out of reach', () => {
    const path = ['provincial-revenue', 'field-army', 'join-expedition'];
    expect(after(...path).resources).toEqual(R(0, 51, 49, 33));
    const options = Object.fromEntries(evaluateChoices(rome, after(...path)).map((e) => [e.choice.id, e]));
    expect(options['restore-imperial-authority']!.available).toBe(false);
    expect(options['restore-imperial-authority']!.requirements.find((r) => !r.met)!.description).toBe(
      'Economy 10 or more (you have 0)',
    );
    expect(options['bargain-with-regions']!.applicableConditionals.map((c) => c.id)).toEqual(['bargain-landowner-loans']);

    const bargain = after(...path, 'bargain-with-regions');
    expect(bargain.resources).toEqual(R(10, 49, 55, 37));
    const record = bargain.records[3]!;
    // The tax relief is still offered (and recorded), the army still loses men.
    expect(record.effects.find((e) => e.resource === 'military')!.applied).toBe(-2);
    expect(record.conditional.map((c) => c.id)).toEqual(['bargain-landowner-loans']);
    // The strain on the bargain is still to come, and the treasury is below its threshold.
    expect(bargain.pending.map((p) => p.consequenceId)).toContain('bargain-strains');
    expect(record.narrative!.effect).toMatch(/right to collect local taxes in exchange for loans/);
    expect(record.narrative!.stakeholders.map((s) => s.id)).toContain('creditors');

    // Ruling through the commander restores order but finds no money.
    const commander = after(...path, 'rule-through-commander');
    expect(commander.resources).toEqual(R(0, 60, 53, 25));
    expect(commander.records[3]!.narrative!.uncertainty).toMatch(/treasury is all but empty/);
  });

  it('collapsed legitimacy (8): the bargain buys recognition; the commander option leaves the emperor powerless', () => {
    const path = ['reform-taxation', 'settle-federates', 'fortify-what-remains'];
    expect(after(...path).resources).toEqual(R(53, 58, 37, 8));
    const options = Object.fromEntries(evaluateChoices(rome, after(...path)).map((e) => [e.choice.id, e]));
    expect(options['restore-imperial-authority']!.available).toBe(false);
    expect(options['bargain-with-regions']!.applicableConditionals.map((c) => c.id)).toEqual([
      'bargain-recognition',
      'bargain-loyal-provinces',
    ]);
    const bargain = after(...path, 'bargain-with-regions');
    expect(bargain.resources).toEqual(R(47, 56, 46, 16));
    expect(bargain.records[3]!.narrative!.effect).toMatch(/^Negotiated survival: with its standing collapsed/);

    const commander = after(...path, 'rule-through-commander');
    expect(commander.resources).toEqual(R(48, 64, 41, 0));
    expect(commander.records[3]!.narrative!.effect).toMatch(/^Temporary stabilisation/);
    expect(commander.pending.map((p) => p.consequenceId)).toContain('commander-ambition');
  });

  it('recovery never restores resources by itself: the state on arrival is exactly what earlier choices produced', () => {
    for (const prefix of d3Paths()) {
      const state = after(...prefix);
      const expected = Object.entries(MATRIX).find(([key]) => key.startsWith(`${prefix.join('/')}/`))![1];
      if (expected.status === 'valid' || expected.status === 'blocked-d4') expect(state.resources).toEqual(expected.atD4);
    }
  });
});

describe('decision 4 reports to the council', () => {
  const report = (path: string[]) => replay(rome, path).records[3]!.narrative!;

  it('every report covers the situation, the decision, who gains and loses, the consequences and the risks', () => {
    for (const path of enumeratePaths(rome)) {
      const n = report(path);
      expect(n.situation!.length).toBeGreaterThan(40);
      expect(Array.isArray(n.situationNotes)).toBe(true);
      expect(n.ordered).toMatch(/^You /);
      expect(n.effect.length).toBeGreaterThan(40);
      expect(n.stakeholders.some((s) => s.impact === 'gains')).toBe(true);
      expect(n.stakeholders.some((s) => s.impact === 'loses')).toBe(true);
      expect(n.uncertainty.length).toBeGreaterThan(40);
      expect(JSON.stringify(n)).toBe(JSON.stringify(report(path)));
    }
  });

  it('the situation reflects earlier decisions, relations with Constantinople and the regions, and resources', () => {
    const notes = (path: string[]) => report(path).situationNotes!.join(' ');
    expect(notes(['pay-the-armies', 'hold-italy', 'join-expedition', 'bargain-with-regions'])).toMatch(
      /sailed with the eastern expedition.*concentrated in Italy.*The army is strong/,
    );
    expect(notes(['provincial-revenue', 'settle-federates', 'treaty-with-gaiseric', 'bargain-with-regions'])).toMatch(
      /own peace with Gaiseric.*Federate leaders/,
    );
    expect(notes(['reform-taxation', 'field-army', 'fortify-what-remains', 'bargain-with-regions'])).toMatch(
      /gave up Africa.*mobile field army/,
    );
    expect(report(['reform-taxation', 'settle-federates', 'fortify-what-remains', 'bargain-with-regions']).situation).toMatch(
      /standing has collapsed/,
    );
    expect(report(['provincial-revenue', 'field-army', 'join-expedition', 'bargain-with-regions']).situation).toMatch(
      /treasury is all but empty/,
    );
    expect(report(['pay-the-armies', 'hold-italy', 'treaty-with-gaiseric', 'bargain-with-regions']).situation).toMatch(
      /^Your council meets/,
    );
  });

  it('uses the variant that matches the state before the choice', () => {
    expect(report(['reform-taxation', 'field-army', 'join-expedition', 'restore-imperial-authority']).effect).toMatch(
      /Constantinople’s public support/,
    );
    expect(report(['provincial-revenue', 'hold-italy', 'treaty-with-gaiseric', 'restore-imperial-authority']).effect).toMatch(
      /without Constantinople’s backing/,
    );
    expect(report(['pay-the-armies', 'hold-italy', 'fortify-what-remains', 'restore-imperial-authority']).uncertainty).toMatch(
      /already divided/,
    );
    expect(report(['reform-taxation', 'field-army', 'treaty-with-gaiseric', 'rule-through-commander']).effect).toMatch(
      /^Temporary stabilisation/,
    );
    expect(report(['reform-taxation', 'field-army', 'fortify-what-remains', 'rule-through-commander']).effect).toMatch(
      /mobile field army that is strong/,
    );
  });

  it('only lists conditional groups when their condition holds', () => {
    const groups = (path: string[]) => report(path).stakeholders.map((s) => s.id);
    expect(groups(['reform-taxation', 'field-army', 'join-expedition', 'restore-imperial-authority'])).toContain('eastern-court');
    expect(groups(['pay-the-armies', 'hold-italy', 'fortify-what-remains', 'restore-imperial-authority'])).not.toContain(
      'eastern-court',
    );
    expect(groups(['pay-the-armies', 'settle-federates', 'fortify-what-remains', 'bargain-with-regions'])).toContain('federates');
  });
});

describe('decision 3 narrative reports', () => {
  const report = (path: string[]) => replay(rome, path).records[2]!.narrative!;

  it('is chosen from the state before the choice, so the same path always reads the same', () => {
    for (const path of d3Paths()) {
      expect(JSON.stringify(report(path))).toBe(JSON.stringify(report(path)));
      expect(report(path)).toBeTruthy();
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
    for (const path of d3Paths()) {
      const n = report(path);
      expect(n.ordered).toMatch(/^You /);
      expect(n.effect.length).toBeGreaterThan(40);
      expect(n.stakeholders.some((s) => s.impact === 'gains')).toBe(true);
      expect(n.stakeholders.some((s) => s.impact === 'loses')).toBe(true);
      expect(n.uncertainty.length).toBeGreaterThan(40);
    }
  });
});
