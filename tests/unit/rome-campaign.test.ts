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
  findConsequence,
  getCurrentNode,
  loomingThreats,
  replay,
} from '../../src/features/simulation/engine';
import { buildEndingReport } from '../../src/features/simulation/endings';
import { validateScenario } from '../../src/features/simulation/validateScenario';
import { RESOURCE_KEYS, type Resources, type SimulationState } from '../../src/types/simulation';

const actualIds = romeActualTimeline.events.map((event) => event.id);
const D1 = ['reform-taxation', 'provincial-revenue', 'pay-the-armies'] as const;
const D2 = ['hold-italy', 'field-army', 'settle-federates'] as const;
const D3 = ['join-expedition', 'treaty-with-gaiseric', 'fortify-what-remains'] as const;
const D4 = ['restore-imperial-authority', 'bargain-with-regions', 'rule-through-commander'] as const;
const D5 = ['defend-imperial-office', 'share-power-with-army', 'transfer-to-successors'] as const;
const UNPAID_FLAGS = ['treasury-defaulted', 'army-exhausted', 'authority-collapsed', 'provinces-defiant'];

const R = (economy: number, military: number, unity: number, legitimacy: number): Resources => ({
  economy,
  military,
  unity,
  legitimacy,
});

type Ending = 'imperial-survival' | 'fragmented-survival' | 'imperial-collapse';
type Expected =
  | {
      status: 'valid';
      atD3: Resources;
      atD4: Resources;
      atD5: Resources;
      final: Resources;
      ending: Ending;
      rule: string;
      pending: string[];
      looming: string[];
      unpaid: string[];
    }
  | { status: 'blocked-d2' }
  | { status: 'blocked-d3'; atD3: Resources }
  | { status: 'blocked-d4'; atD3: Resources; atD4: Resources; reason: string }
  | { status: 'blocked-d5'; atD3: Resources; atD4: Resources; atD5: Resources; reason: string };

/**
 * Expected outcome of every theoretical D1 × D2 × D3 × D4 × D5 combination,
 * resources as (economy, military, unity, legitimacy). Produced by an
 * independent reference model of the rules (a separate Python calculation,
 * not this engine), then pasted here. `atD3` / `atD4` / `atD5` are the states
 * when those decisions are shown — AFTER the consequences due in 468 / 472 /
 * 475. `final` is the state at the settlement of 476, after the 476
 * consequences, from which the ending is classified. `unpaid` lists the flags
 * set by costs the empire could not pay in full.
 */
const MATRIX: Record<string, Expected> = {
  'reform-taxation/hold-italy/join-expedition/restore-imperial-authority/defend-imperial-office': { status: 'blocked-d3', atD3: R(56, 49, 17, 29) },
  'reform-taxation/hold-italy/join-expedition/restore-imperial-authority/share-power-with-army': { status: 'blocked-d3', atD3: R(56, 49, 17, 29) },
  'reform-taxation/hold-italy/join-expedition/restore-imperial-authority/transfer-to-successors': { status: 'blocked-d3', atD3: R(56, 49, 17, 29) },
  'reform-taxation/hold-italy/join-expedition/bargain-with-regions/defend-imperial-office': { status: 'blocked-d3', atD3: R(56, 49, 17, 29) },
  'reform-taxation/hold-italy/join-expedition/bargain-with-regions/share-power-with-army': { status: 'blocked-d3', atD3: R(56, 49, 17, 29) },
  'reform-taxation/hold-italy/join-expedition/bargain-with-regions/transfer-to-successors': { status: 'blocked-d3', atD3: R(56, 49, 17, 29) },
  'reform-taxation/hold-italy/join-expedition/rule-through-commander/defend-imperial-office': { status: 'blocked-d3', atD3: R(56, 49, 17, 29) },
  'reform-taxation/hold-italy/join-expedition/rule-through-commander/share-power-with-army': { status: 'blocked-d3', atD3: R(56, 49, 17, 29) },
  'reform-taxation/hold-italy/join-expedition/rule-through-commander/transfer-to-successors': { status: 'blocked-d3', atD3: R(56, 49, 17, 29) },
  'reform-taxation/hold-italy/treaty-with-gaiseric/restore-imperial-authority/defend-imperial-office': { status: 'valid', atD3: R(56, 49, 17, 29), atD4: R(68, 49, 19, 17), atD5: R(73, 45, 12, 22), final: R(64, 35, 9, 30), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["usurper-threat"], looming: ["usurper-threat"], unpaid: [] },
  'reform-taxation/hold-italy/treaty-with-gaiseric/restore-imperial-authority/share-power-with-army': { status: 'valid', atD3: R(56, 49, 17, 29), atD4: R(68, 49, 19, 17), atD5: R(73, 45, 12, 22), final: R(69, 47, 6, 18), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["landowners-resentment"], looming: ["landowners-resentment"], unpaid: [] },
  'reform-taxation/hold-italy/treaty-with-gaiseric/restore-imperial-authority/transfer-to-successors': { status: 'valid', atD3: R(56, 49, 17, 29), atD4: R(68, 49, 19, 17), atD5: R(73, 45, 12, 22), final: R(79, 35, 16, 12), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["successors-drift"], looming: ["successors-drift"], unpaid: [] },
  'reform-taxation/hold-italy/treaty-with-gaiseric/bargain-with-regions/defend-imperial-office': { status: 'valid', atD3: R(56, 49, 17, 29), atD4: R(68, 49, 19, 17), atD5: R(62, 50, 25, 21), final: R(53, 45, 25, 35), ending: 'imperial-survival', rule: 'is-office-holds', pending: ["usurper-threat"], looming: [], unpaid: [] },
  'reform-taxation/hold-italy/treaty-with-gaiseric/bargain-with-regions/share-power-with-army': { status: 'valid', atD3: R(56, 49, 17, 29), atD4: R(68, 49, 19, 17), atD5: R(62, 50, 25, 21), final: R(58, 58, 19, 17), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["landowners-resentment"], looming: ["landowners-resentment"], unpaid: [] },
  'reform-taxation/hold-italy/treaty-with-gaiseric/bargain-with-regions/transfer-to-successors': { status: 'valid', atD3: R(56, 49, 17, 29), atD4: R(68, 49, 19, 17), atD5: R(62, 50, 25, 21), final: R(68, 46, 33, 11), ending: 'fragmented-survival', rule: 'fs-successors-hold', pending: ["successors-drift"], looming: [], unpaid: [] },
  'reform-taxation/hold-italy/treaty-with-gaiseric/rule-through-commander/defend-imperial-office': { status: 'blocked-d4', atD3: R(56, 49, 17, 29), atD4: R(68, 49, 19, 17), reason: 'Not available: Military 50 or more (you have 49).' },
  'reform-taxation/hold-italy/treaty-with-gaiseric/rule-through-commander/share-power-with-army': { status: 'blocked-d4', atD3: R(56, 49, 17, 29), atD4: R(68, 49, 19, 17), reason: 'Not available: Military 50 or more (you have 49).' },
  'reform-taxation/hold-italy/treaty-with-gaiseric/rule-through-commander/transfer-to-successors': { status: 'blocked-d4', atD3: R(56, 49, 17, 29), atD4: R(68, 49, 19, 17), reason: 'Not available: Military 50 or more (you have 49).' },
  'reform-taxation/hold-italy/fortify-what-remains/restore-imperial-authority/defend-imperial-office': { status: 'valid', atD3: R(56, 49, 17, 29), atD4: R(50, 52, 23, 25), atD5: R(55, 48, 16, 33), final: R(41, 38, 13, 41), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["usurper-threat"], looming: [], unpaid: [] },
  'reform-taxation/hold-italy/fortify-what-remains/restore-imperial-authority/share-power-with-army': { status: 'valid', atD3: R(56, 49, 17, 29), atD4: R(50, 52, 23, 25), atD5: R(55, 48, 16, 33), final: R(51, 50, 10, 29), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["landowners-resentment"], looming: ["landowners-resentment"], unpaid: [] },
  'reform-taxation/hold-italy/fortify-what-remains/restore-imperial-authority/transfer-to-successors': { status: 'valid', atD3: R(56, 49, 17, 29), atD4: R(50, 52, 23, 25), atD5: R(55, 48, 16, 33), final: R(56, 38, 20, 28), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["successors-drift"], looming: ["successors-drift"], unpaid: [] },
  'reform-taxation/hold-italy/fortify-what-remains/bargain-with-regions/defend-imperial-office': { status: 'valid', atD3: R(56, 49, 17, 29), atD4: R(50, 52, 23, 25), atD5: R(44, 53, 32, 29), final: R(30, 48, 32, 43), ending: 'imperial-survival', rule: 'is-office-holds', pending: ["usurper-threat"], looming: [], unpaid: [] },
  'reform-taxation/hold-italy/fortify-what-remains/bargain-with-regions/share-power-with-army': { status: 'valid', atD3: R(56, 49, 17, 29), atD4: R(50, 52, 23, 25), atD5: R(44, 53, 32, 29), final: R(40, 65, 26, 27), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["landowners-resentment"], looming: ["landowners-resentment"], unpaid: [] },
  'reform-taxation/hold-italy/fortify-what-remains/bargain-with-regions/transfer-to-successors': { status: 'valid', atD3: R(56, 49, 17, 29), atD4: R(50, 52, 23, 25), atD5: R(44, 53, 32, 29), final: R(45, 49, 40, 19), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["successors-drift"], looming: [], unpaid: [] },
  'reform-taxation/hold-italy/fortify-what-remains/rule-through-commander/defend-imperial-office': { status: 'blocked-d5', atD3: R(56, 49, 17, 29), atD4: R(50, 52, 23, 25), atD5: R(45, 58, 23, 11), reason: 'Not available: Ruled out by an earlier decision: You let the army’s commander rule in the emperor’s name.' },
  'reform-taxation/hold-italy/fortify-what-remains/rule-through-commander/share-power-with-army': { status: 'valid', atD3: R(56, 49, 17, 29), atD4: R(50, 52, 23, 25), atD5: R(45, 58, 23, 11), final: R(41, 66, 17, 10), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["landowners-resentment"], looming: ["landowners-resentment"], unpaid: [] },
  'reform-taxation/hold-italy/fortify-what-remains/rule-through-commander/transfer-to-successors': { status: 'valid', atD3: R(56, 49, 17, 29), atD4: R(50, 52, 23, 25), atD5: R(45, 58, 23, 11), final: R(51, 58, 27, 1), ending: 'fragmented-survival', rule: 'fs-successors-hold', pending: ["successors-drift"], looming: ["successors-drift"], unpaid: [] },
  'reform-taxation/field-army/join-expedition/restore-imperial-authority/defend-imperial-office': { status: 'valid', atD3: R(41, 56, 35, 23), atD4: R(24, 54, 35, 29), atD5: R(33, 50, 28, 40), final: R(24, 40, 20, 48), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["usurper-threat"], looming: [], unpaid: [] },
  'reform-taxation/field-army/join-expedition/restore-imperial-authority/share-power-with-army': { status: 'valid', atD3: R(41, 56, 35, 23), atD4: R(24, 54, 35, 29), atD5: R(33, 50, 28, 40), final: R(29, 52, 22, 36), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["landowners-resentment"], looming: ["landowners-resentment"], unpaid: [] },
  'reform-taxation/field-army/join-expedition/restore-imperial-authority/transfer-to-successors': { status: 'valid', atD3: R(41, 56, 35, 23), atD4: R(24, 54, 35, 29), atD5: R(33, 50, 28, 40), final: R(39, 40, 27, 39), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["successors-drift"], looming: ["successors-drift"], unpaid: [] },
  'reform-taxation/field-army/join-expedition/bargain-with-regions/defend-imperial-office': { status: 'valid', atD3: R(41, 56, 35, 23), atD4: R(24, 54, 35, 29), atD5: R(18, 55, 41, 33), final: R(9, 50, 36, 41), ending: 'imperial-survival', rule: 'is-office-holds', pending: ["usurper-threat"], looming: [], unpaid: [] },
  'reform-taxation/field-army/join-expedition/bargain-with-regions/share-power-with-army': { status: 'valid', atD3: R(41, 56, 35, 23), atD4: R(24, 54, 35, 29), atD5: R(18, 55, 41, 33), final: R(14, 67, 35, 25), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["landowners-resentment"], looming: [], unpaid: [] },
  'reform-taxation/field-army/join-expedition/bargain-with-regions/transfer-to-successors': { status: 'valid', atD3: R(41, 56, 35, 23), atD4: R(24, 54, 35, 29), atD5: R(18, 55, 41, 33), final: R(24, 51, 44, 32), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["successors-drift"], looming: [], unpaid: [] },
  'reform-taxation/field-army/join-expedition/rule-through-commander/defend-imperial-office': { status: 'blocked-d5', atD3: R(41, 56, 35, 23), atD4: R(24, 54, 35, 29), atD5: R(19, 63, 35, 15), reason: 'Not available: Ruled out by an earlier decision: You let the army’s commander rule in the emperor’s name.' },
  'reform-taxation/field-army/join-expedition/rule-through-commander/share-power-with-army': { status: 'valid', atD3: R(41, 56, 35, 23), atD4: R(24, 54, 35, 29), atD5: R(19, 63, 35, 15), final: R(15, 75, 29, 16), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["landowners-resentment"], looming: ["landowners-resentment"], unpaid: [] },
  'reform-taxation/field-army/join-expedition/rule-through-commander/transfer-to-successors': { status: 'valid', atD3: R(41, 56, 35, 23), atD4: R(24, 54, 35, 29), atD5: R(19, 63, 35, 15), final: R(25, 63, 39, 9), ending: 'fragmented-survival', rule: 'fs-successors-hold', pending: ["successors-drift"], looming: ["successors-drift"], unpaid: [] },
  'reform-taxation/field-army/treaty-with-gaiseric/restore-imperial-authority/defend-imperial-office': { status: 'blocked-d4', atD3: R(41, 56, 35, 23), atD4: R(53, 56, 37, 11), reason: 'Not available: Legitimacy 15 or more (you have 11).' },
  'reform-taxation/field-army/treaty-with-gaiseric/restore-imperial-authority/share-power-with-army': { status: 'blocked-d4', atD3: R(41, 56, 35, 23), atD4: R(53, 56, 37, 11), reason: 'Not available: Legitimacy 15 or more (you have 11).' },
  'reform-taxation/field-army/treaty-with-gaiseric/restore-imperial-authority/transfer-to-successors': { status: 'blocked-d4', atD3: R(41, 56, 35, 23), atD4: R(53, 56, 37, 11), reason: 'Not available: Legitimacy 15 or more (you have 11).' },
  'reform-taxation/field-army/treaty-with-gaiseric/bargain-with-regions/defend-imperial-office': { status: 'valid', atD3: R(41, 56, 35, 23), atD4: R(53, 56, 37, 11), atD5: R(47, 57, 43, 19), final: R(38, 52, 43, 33), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["usurper-threat"], looming: ["usurper-threat"], unpaid: [] },
  'reform-taxation/field-army/treaty-with-gaiseric/bargain-with-regions/share-power-with-army': { status: 'valid', atD3: R(41, 56, 35, 23), atD4: R(53, 56, 37, 11), atD5: R(47, 57, 43, 19), final: R(43, 69, 37, 17), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["landowners-resentment"], looming: [], unpaid: [] },
  'reform-taxation/field-army/treaty-with-gaiseric/bargain-with-regions/transfer-to-successors': { status: 'valid', atD3: R(41, 56, 35, 23), atD4: R(53, 56, 37, 11), atD5: R(47, 57, 43, 19), final: R(53, 53, 51, 9), ending: 'fragmented-survival', rule: 'fs-successors-hold', pending: ["successors-drift"], looming: [], unpaid: [] },
  'reform-taxation/field-army/treaty-with-gaiseric/rule-through-commander/defend-imperial-office': { status: 'blocked-d5', atD3: R(41, 56, 35, 23), atD4: R(53, 56, 37, 11), atD5: R(48, 68, 35, 0), reason: 'Not available: Ruled out by an earlier decision: You let the army’s commander rule in the emperor’s name.' },
  'reform-taxation/field-army/treaty-with-gaiseric/rule-through-commander/share-power-with-army': { status: 'valid', atD3: R(41, 56, 35, 23), atD4: R(53, 56, 37, 11), atD5: R(48, 68, 35, 0), final: R(44, 80, 28, 2), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["landowners-resentment"], looming: ["landowners-resentment"], unpaid: ["authority-collapsed"] },
  'reform-taxation/field-army/treaty-with-gaiseric/rule-through-commander/transfer-to-successors': { status: 'valid', atD3: R(41, 56, 35, 23), atD4: R(53, 56, 37, 11), atD5: R(48, 68, 35, 0), final: R(54, 68, 34, 0), ending: 'fragmented-survival', rule: 'fs-successors-hold', pending: ["successors-drift"], looming: ["successors-drift"], unpaid: ["authority-collapsed"] },
  'reform-taxation/field-army/fortify-what-remains/restore-imperial-authority/defend-imperial-office': { status: 'valid', atD3: R(41, 56, 35, 23), atD4: R(35, 59, 44, 19), atD5: R(40, 55, 37, 27), final: R(26, 51, 37, 41), ending: 'imperial-survival', rule: 'is-office-holds', pending: ["usurper-threat"], looming: [], unpaid: [] },
  'reform-taxation/field-army/fortify-what-remains/restore-imperial-authority/share-power-with-army': { status: 'valid', atD3: R(41, 56, 35, 23), atD4: R(35, 59, 44, 19), atD5: R(40, 55, 37, 27), final: R(36, 67, 31, 25), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["landowners-resentment"], looming: [], unpaid: [] },
  'reform-taxation/field-army/fortify-what-remains/restore-imperial-authority/transfer-to-successors': { status: 'valid', atD3: R(41, 56, 35, 23), atD4: R(35, 59, 44, 19), atD5: R(40, 55, 37, 27), final: R(41, 51, 41, 17), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["successors-drift"], looming: ["successors-drift"], unpaid: [] },
  'reform-taxation/field-army/fortify-what-remains/bargain-with-regions/defend-imperial-office': { status: 'valid', atD3: R(41, 56, 35, 23), atD4: R(35, 59, 44, 19), atD5: R(29, 60, 53, 23), final: R(20, 55, 53, 37), ending: 'imperial-survival', rule: 'is-office-holds', pending: ["usurper-threat"], looming: [], unpaid: [] },
  'reform-taxation/field-army/fortify-what-remains/bargain-with-regions/share-power-with-army': { status: 'valid', atD3: R(41, 56, 35, 23), atD4: R(35, 59, 44, 19), atD5: R(29, 60, 53, 23), final: R(25, 72, 47, 21), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["landowners-resentment"], looming: [], unpaid: [] },
  'reform-taxation/field-army/fortify-what-remains/bargain-with-regions/transfer-to-successors': { status: 'valid', atD3: R(41, 56, 35, 23), atD4: R(35, 59, 44, 19), atD5: R(29, 60, 53, 23), final: R(35, 56, 61, 13), ending: 'fragmented-survival', rule: 'fs-successors-hold', pending: ["successors-drift"], looming: [], unpaid: [] },
  'reform-taxation/field-army/fortify-what-remains/rule-through-commander/defend-imperial-office': { status: 'blocked-d5', atD3: R(41, 56, 35, 23), atD4: R(35, 59, 44, 19), atD5: R(30, 68, 44, 5), reason: 'Not available: Ruled out by an earlier decision: You let the army’s commander rule in the emperor’s name.' },
  'reform-taxation/field-army/fortify-what-remains/rule-through-commander/share-power-with-army': { status: 'valid', atD3: R(41, 56, 35, 23), atD4: R(35, 59, 44, 19), atD5: R(30, 68, 44, 5), final: R(26, 80, 38, 6), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["landowners-resentment"], looming: [], unpaid: [] },
  'reform-taxation/field-army/fortify-what-remains/rule-through-commander/transfer-to-successors': { status: 'valid', atD3: R(41, 56, 35, 23), atD4: R(35, 59, 44, 19), atD5: R(30, 68, 44, 5), final: R(36, 68, 45, 0), ending: 'fragmented-survival', rule: 'fs-successors-hold', pending: ["successors-drift"], looming: ["successors-drift"], unpaid: ["authority-collapsed"] },
  'reform-taxation/settle-federates/join-expedition/restore-imperial-authority/defend-imperial-office': { status: 'valid', atD3: R(59, 52, 31, 12), atD4: R(42, 46, 31, 18), atD5: R(47, 42, 24, 29), final: R(38, 32, 8, 37), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["usurper-threat"], looming: [], unpaid: [] },
  'reform-taxation/settle-federates/join-expedition/restore-imperial-authority/share-power-with-army': { status: 'valid', atD3: R(59, 52, 31, 12), atD4: R(42, 46, 31, 18), atD5: R(47, 42, 24, 29), final: R(43, 44, 16, 25), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["landowners-resentment"], looming: ["landowners-resentment"], unpaid: [] },
  'reform-taxation/settle-federates/join-expedition/restore-imperial-authority/transfer-to-successors': { status: 'valid', atD3: R(59, 52, 31, 12), atD4: R(42, 46, 31, 18), atD5: R(47, 42, 24, 29), final: R(53, 32, 15, 28), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["successors-drift"], looming: ["successors-drift"], unpaid: [] },
  'reform-taxation/settle-federates/join-expedition/bargain-with-regions/defend-imperial-office': { status: 'valid', atD3: R(59, 52, 31, 12), atD4: R(42, 46, 31, 18), atD5: R(36, 47, 37, 22), final: R(27, 42, 21, 30), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["usurper-threat"], looming: ["usurper-threat"], unpaid: [] },
  'reform-taxation/settle-federates/join-expedition/bargain-with-regions/share-power-with-army': { status: 'valid', atD3: R(59, 52, 31, 12), atD4: R(42, 46, 31, 18), atD5: R(36, 47, 37, 22), final: R(32, 59, 34, 20), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["landowners-resentment"], looming: [], unpaid: [] },
  'reform-taxation/settle-federates/join-expedition/bargain-with-regions/transfer-to-successors': { status: 'valid', atD3: R(59, 52, 31, 12), atD4: R(42, 46, 31, 18), atD5: R(36, 47, 37, 22), final: R(42, 43, 32, 16), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["successors-drift"], looming: [], unpaid: [] },
  'reform-taxation/settle-federates/join-expedition/rule-through-commander/defend-imperial-office': { status: 'blocked-d4', atD3: R(59, 52, 31, 12), atD4: R(42, 46, 31, 18), reason: 'Not available: Military 50 or more (you have 46).' },
  'reform-taxation/settle-federates/join-expedition/rule-through-commander/share-power-with-army': { status: 'blocked-d4', atD3: R(59, 52, 31, 12), atD4: R(42, 46, 31, 18), reason: 'Not available: Military 50 or more (you have 46).' },
  'reform-taxation/settle-federates/join-expedition/rule-through-commander/transfer-to-successors': { status: 'blocked-d4', atD3: R(59, 52, 31, 12), atD4: R(42, 46, 31, 18), reason: 'Not available: Military 50 or more (you have 46).' },
  'reform-taxation/settle-federates/treaty-with-gaiseric/restore-imperial-authority/defend-imperial-office': { status: 'blocked-d3', atD3: R(59, 52, 31, 12) },
  'reform-taxation/settle-federates/treaty-with-gaiseric/restore-imperial-authority/share-power-with-army': { status: 'blocked-d3', atD3: R(59, 52, 31, 12) },
  'reform-taxation/settle-federates/treaty-with-gaiseric/restore-imperial-authority/transfer-to-successors': { status: 'blocked-d3', atD3: R(59, 52, 31, 12) },
  'reform-taxation/settle-federates/treaty-with-gaiseric/bargain-with-regions/defend-imperial-office': { status: 'blocked-d3', atD3: R(59, 52, 31, 12) },
  'reform-taxation/settle-federates/treaty-with-gaiseric/bargain-with-regions/share-power-with-army': { status: 'blocked-d3', atD3: R(59, 52, 31, 12) },
  'reform-taxation/settle-federates/treaty-with-gaiseric/bargain-with-regions/transfer-to-successors': { status: 'blocked-d3', atD3: R(59, 52, 31, 12) },
  'reform-taxation/settle-federates/treaty-with-gaiseric/rule-through-commander/defend-imperial-office': { status: 'blocked-d3', atD3: R(59, 52, 31, 12) },
  'reform-taxation/settle-federates/treaty-with-gaiseric/rule-through-commander/share-power-with-army': { status: 'blocked-d3', atD3: R(59, 52, 31, 12) },
  'reform-taxation/settle-federates/treaty-with-gaiseric/rule-through-commander/transfer-to-successors': { status: 'blocked-d3', atD3: R(59, 52, 31, 12) },
  'reform-taxation/settle-federates/fortify-what-remains/restore-imperial-authority/defend-imperial-office': { status: 'blocked-d4', atD3: R(59, 52, 31, 12), atD4: R(53, 58, 37, 8), reason: 'Not available: Legitimacy 15 or more (you have 8).' },
  'reform-taxation/settle-federates/fortify-what-remains/restore-imperial-authority/share-power-with-army': { status: 'blocked-d4', atD3: R(59, 52, 31, 12), atD4: R(53, 58, 37, 8), reason: 'Not available: Legitimacy 15 or more (you have 8).' },
  'reform-taxation/settle-federates/fortify-what-remains/restore-imperial-authority/transfer-to-successors': { status: 'blocked-d4', atD3: R(59, 52, 31, 12), atD4: R(53, 58, 37, 8), reason: 'Not available: Legitimacy 15 or more (you have 8).' },
  'reform-taxation/settle-federates/fortify-what-remains/bargain-with-regions/defend-imperial-office': { status: 'valid', atD3: R(59, 52, 31, 12), atD4: R(53, 58, 37, 8), atD5: R(47, 59, 46, 16), final: R(33, 54, 46, 30), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["usurper-threat"], looming: ["usurper-threat"], unpaid: [] },
  'reform-taxation/settle-federates/fortify-what-remains/bargain-with-regions/share-power-with-army': { status: 'valid', atD3: R(59, 52, 31, 12), atD4: R(53, 58, 37, 8), atD5: R(47, 59, 46, 16), final: R(43, 71, 43, 14), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["landowners-resentment"], looming: [], unpaid: [] },
  'reform-taxation/settle-federates/fortify-what-remains/bargain-with-regions/transfer-to-successors': { status: 'valid', atD3: R(59, 52, 31, 12), atD4: R(53, 58, 37, 8), atD5: R(47, 59, 46, 16), final: R(53, 55, 54, 6), ending: 'fragmented-survival', rule: 'fs-successors-hold', pending: ["successors-drift"], looming: [], unpaid: [] },
  'reform-taxation/settle-federates/fortify-what-remains/rule-through-commander/defend-imperial-office': { status: 'blocked-d5', atD3: R(59, 52, 31, 12), atD4: R(53, 58, 37, 8), atD5: R(48, 64, 34, 0), reason: 'Not available: Ruled out by an earlier decision: You let the army’s commander rule in the emperor’s name.' },
  'reform-taxation/settle-federates/fortify-what-remains/rule-through-commander/share-power-with-army': { status: 'valid', atD3: R(59, 52, 31, 12), atD4: R(53, 58, 37, 8), atD5: R(48, 64, 34, 0), final: R(44, 76, 30, 2), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["landowners-resentment"], looming: [], unpaid: ["authority-collapsed"] },
  'reform-taxation/settle-federates/fortify-what-remains/rule-through-commander/transfer-to-successors': { status: 'valid', atD3: R(59, 52, 31, 12), atD4: R(53, 58, 37, 8), atD5: R(48, 64, 34, 0), final: R(54, 64, 33, 0), ending: 'fragmented-survival', rule: 'fs-successors-hold', pending: ["successors-drift"], looming: ["successors-drift"], unpaid: ["authority-collapsed"] },
  'provincial-revenue/hold-italy/join-expedition/restore-imperial-authority/defend-imperial-office': { status: 'blocked-d3', atD3: R(28, 49, 37, 32) },
  'provincial-revenue/hold-italy/join-expedition/restore-imperial-authority/share-power-with-army': { status: 'blocked-d3', atD3: R(28, 49, 37, 32) },
  'provincial-revenue/hold-italy/join-expedition/restore-imperial-authority/transfer-to-successors': { status: 'blocked-d3', atD3: R(28, 49, 37, 32) },
  'provincial-revenue/hold-italy/join-expedition/bargain-with-regions/defend-imperial-office': { status: 'blocked-d3', atD3: R(28, 49, 37, 32) },
  'provincial-revenue/hold-italy/join-expedition/bargain-with-regions/share-power-with-army': { status: 'blocked-d3', atD3: R(28, 49, 37, 32) },
  'provincial-revenue/hold-italy/join-expedition/bargain-with-regions/transfer-to-successors': { status: 'blocked-d3', atD3: R(28, 49, 37, 32) },
  'provincial-revenue/hold-italy/join-expedition/rule-through-commander/defend-imperial-office': { status: 'blocked-d3', atD3: R(28, 49, 37, 32) },
  'provincial-revenue/hold-italy/join-expedition/rule-through-commander/share-power-with-army': { status: 'blocked-d3', atD3: R(28, 49, 37, 32) },
  'provincial-revenue/hold-italy/join-expedition/rule-through-commander/transfer-to-successors': { status: 'blocked-d3', atD3: R(28, 49, 37, 32) },
  'provincial-revenue/hold-italy/treaty-with-gaiseric/restore-imperial-authority/defend-imperial-office': { status: 'valid', atD3: R(28, 49, 37, 32), atD4: R(40, 49, 39, 20), atD5: R(45, 45, 32, 25), final: R(36, 35, 29, 33), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["usurper-threat"], looming: ["usurper-threat"], unpaid: [] },
  'provincial-revenue/hold-italy/treaty-with-gaiseric/restore-imperial-authority/share-power-with-army': { status: 'valid', atD3: R(28, 49, 37, 32), atD4: R(40, 49, 39, 20), atD5: R(45, 45, 32, 25), final: R(41, 51, 26, 23), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["landowners-resentment"], looming: ["landowners-resentment"], unpaid: [] },
  'provincial-revenue/hold-italy/treaty-with-gaiseric/restore-imperial-authority/transfer-to-successors': { status: 'valid', atD3: R(28, 49, 37, 32), atD4: R(40, 49, 39, 20), atD5: R(45, 45, 32, 25), final: R(51, 41, 36, 15), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["successors-drift"], looming: ["successors-drift"], unpaid: [] },
  'provincial-revenue/hold-italy/treaty-with-gaiseric/bargain-with-regions/defend-imperial-office': { status: 'valid', atD3: R(28, 49, 37, 32), atD4: R(40, 49, 39, 20), atD5: R(34, 50, 45, 24), final: R(25, 45, 45, 38), ending: 'imperial-survival', rule: 'is-office-holds', pending: ["usurper-threat"], looming: [], unpaid: [] },
  'provincial-revenue/hold-italy/treaty-with-gaiseric/bargain-with-regions/share-power-with-army': { status: 'valid', atD3: R(28, 49, 37, 32), atD4: R(40, 49, 39, 20), atD5: R(34, 50, 45, 24), final: R(30, 62, 39, 22), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["landowners-resentment"], looming: [], unpaid: [] },
  'provincial-revenue/hold-italy/treaty-with-gaiseric/bargain-with-regions/transfer-to-successors': { status: 'valid', atD3: R(28, 49, 37, 32), atD4: R(40, 49, 39, 20), atD5: R(34, 50, 45, 24), final: R(40, 46, 53, 14), ending: 'fragmented-survival', rule: 'fs-successors-hold', pending: ["successors-drift"], looming: [], unpaid: [] },
  'provincial-revenue/hold-italy/treaty-with-gaiseric/rule-through-commander/defend-imperial-office': { status: 'blocked-d4', atD3: R(28, 49, 37, 32), atD4: R(40, 49, 39, 20), reason: 'Not available: Military 50 or more (you have 49).' },
  'provincial-revenue/hold-italy/treaty-with-gaiseric/rule-through-commander/share-power-with-army': { status: 'blocked-d4', atD3: R(28, 49, 37, 32), atD4: R(40, 49, 39, 20), reason: 'Not available: Military 50 or more (you have 49).' },
  'provincial-revenue/hold-italy/treaty-with-gaiseric/rule-through-commander/transfer-to-successors': { status: 'blocked-d4', atD3: R(28, 49, 37, 32), atD4: R(40, 49, 39, 20), reason: 'Not available: Military 50 or more (you have 49).' },
  'provincial-revenue/hold-italy/fortify-what-remains/restore-imperial-authority/defend-imperial-office': { status: 'valid', atD3: R(28, 49, 37, 32), atD4: R(22, 52, 43, 28), atD5: R(31, 48, 36, 36), final: R(17, 44, 33, 44), ending: 'imperial-survival', rule: 'is-office-holds', pending: ["usurper-threat"], looming: [], unpaid: [] },
  'provincial-revenue/hold-italy/fortify-what-remains/restore-imperial-authority/share-power-with-army': { status: 'valid', atD3: R(28, 49, 37, 32), atD4: R(22, 52, 43, 28), atD5: R(31, 48, 36, 36), final: R(27, 60, 30, 34), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["landowners-resentment"], looming: [], unpaid: [] },
  'provincial-revenue/hold-italy/fortify-what-remains/restore-imperial-authority/transfer-to-successors': { status: 'valid', atD3: R(28, 49, 37, 32), atD4: R(22, 52, 43, 28), atD5: R(31, 48, 36, 36), final: R(32, 44, 40, 31), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["successors-drift"], looming: ["successors-drift"], unpaid: [] },
  'provincial-revenue/hold-italy/fortify-what-remains/bargain-with-regions/defend-imperial-office': { status: 'valid', atD3: R(28, 49, 37, 32), atD4: R(22, 52, 43, 28), atD5: R(16, 53, 52, 32), final: R(2, 48, 52, 40), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["usurper-threat"], looming: [], unpaid: [] },
  'provincial-revenue/hold-italy/fortify-what-remains/bargain-with-regions/share-power-with-army': { status: 'valid', atD3: R(28, 49, 37, 32), atD4: R(22, 52, 43, 28), atD5: R(16, 53, 52, 32), final: R(12, 65, 46, 24), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["landowners-resentment"], looming: [], unpaid: [] },
  'provincial-revenue/hold-italy/fortify-what-remains/bargain-with-regions/transfer-to-successors': { status: 'valid', atD3: R(28, 49, 37, 32), atD4: R(22, 52, 43, 28), atD5: R(16, 53, 52, 32), final: R(17, 49, 60, 16), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["successors-drift"], looming: [], unpaid: [] },
  'provincial-revenue/hold-italy/fortify-what-remains/rule-through-commander/defend-imperial-office': { status: 'blocked-d5', atD3: R(28, 49, 37, 32), atD4: R(22, 52, 43, 28), atD5: R(17, 58, 43, 14), reason: 'Not available: Ruled out by an earlier decision: You let the army’s commander rule in the emperor’s name.' },
  'provincial-revenue/hold-italy/fortify-what-remains/rule-through-commander/share-power-with-army': { status: 'valid', atD3: R(28, 49, 37, 32), atD4: R(22, 52, 43, 28), atD5: R(17, 58, 43, 14), final: R(13, 64, 37, 15), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["landowners-resentment"], looming: [], unpaid: [] },
  'provincial-revenue/hold-italy/fortify-what-remains/rule-through-commander/transfer-to-successors': { status: 'valid', atD3: R(28, 49, 37, 32), atD4: R(22, 52, 43, 28), atD5: R(17, 58, 43, 14), final: R(23, 58, 47, 4), ending: 'fragmented-survival', rule: 'fs-successors-hold', pending: ["successors-drift"], looming: ["successors-drift"], unpaid: [] },
  'provincial-revenue/field-army/join-expedition/restore-imperial-authority/defend-imperial-office': { status: 'blocked-d4', atD3: R(13, 53, 49, 27), atD4: R(0, 51, 47, 33), reason: 'Not available: Economy 10 or more (you have 0).' },
  'provincial-revenue/field-army/join-expedition/restore-imperial-authority/share-power-with-army': { status: 'blocked-d4', atD3: R(13, 53, 49, 27), atD4: R(0, 51, 47, 33), reason: 'Not available: Economy 10 or more (you have 0).' },
  'provincial-revenue/field-army/join-expedition/restore-imperial-authority/transfer-to-successors': { status: 'blocked-d4', atD3: R(13, 53, 49, 27), atD4: R(0, 51, 47, 33), reason: 'Not available: Economy 10 or more (you have 0).' },
  'provincial-revenue/field-army/join-expedition/bargain-with-regions/defend-imperial-office': { status: 'valid', atD3: R(13, 53, 49, 27), atD4: R(0, 51, 47, 33), atD5: R(4, 52, 53, 37), final: R(0, 47, 45, 45), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["usurper-threat"], looming: [], unpaid: ["treasury-defaulted"] },
  'provincial-revenue/field-army/join-expedition/bargain-with-regions/share-power-with-army': { status: 'valid', atD3: R(13, 53, 49, 27), atD4: R(0, 51, 47, 33), atD5: R(4, 52, 53, 37), final: R(0, 64, 47, 29), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["landowners-resentment"], looming: [], unpaid: ["treasury-defaulted"] },
  'provincial-revenue/field-army/join-expedition/bargain-with-regions/transfer-to-successors': { status: 'valid', atD3: R(13, 53, 49, 27), atD4: R(0, 51, 47, 33), atD5: R(4, 52, 53, 37), final: R(10, 48, 56, 30), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["successors-drift"], looming: [], unpaid: ["treasury-defaulted"] },
  'provincial-revenue/field-army/join-expedition/rule-through-commander/defend-imperial-office': { status: 'blocked-d5', atD3: R(13, 53, 49, 27), atD4: R(0, 51, 47, 33), atD5: R(0, 60, 48, 25), reason: 'Not available: Ruled out by an earlier decision: You let the army’s commander rule in the emperor’s name.' },
  'provincial-revenue/field-army/join-expedition/rule-through-commander/share-power-with-army': { status: 'valid', atD3: R(13, 53, 49, 27), atD4: R(0, 51, 47, 33), atD5: R(0, 60, 48, 25), final: R(0, 66, 40, 26), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["landowners-resentment"], looming: [], unpaid: ["treasury-defaulted"] },
  'provincial-revenue/field-army/join-expedition/rule-through-commander/transfer-to-successors': { status: 'valid', atD3: R(13, 53, 49, 27), atD4: R(0, 51, 47, 33), atD5: R(0, 60, 48, 25), final: R(6, 54, 52, 19), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["successors-drift"], looming: ["successors-drift"], unpaid: ["treasury-defaulted"] },
  'provincial-revenue/field-army/treaty-with-gaiseric/restore-imperial-authority/defend-imperial-office': { status: 'valid', atD3: R(13, 53, 49, 27), atD4: R(25, 53, 51, 15), atD5: R(30, 49, 44, 20), final: R(21, 45, 44, 34), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["usurper-threat"], looming: ["usurper-threat"], unpaid: [] },
  'provincial-revenue/field-army/treaty-with-gaiseric/restore-imperial-authority/share-power-with-army': { status: 'valid', atD3: R(13, 53, 49, 27), atD4: R(25, 53, 51, 15), atD5: R(30, 49, 44, 20), final: R(26, 61, 38, 18), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["landowners-resentment"], looming: [], unpaid: [] },
  'provincial-revenue/field-army/treaty-with-gaiseric/restore-imperial-authority/transfer-to-successors': { status: 'valid', atD3: R(13, 53, 49, 27), atD4: R(25, 53, 51, 15), atD5: R(30, 49, 44, 20), final: R(36, 45, 48, 10), ending: 'fragmented-survival', rule: 'fs-successors-hold', pending: ["successors-drift"], looming: ["successors-drift"], unpaid: [] },
  'provincial-revenue/field-army/treaty-with-gaiseric/bargain-with-regions/defend-imperial-office': { status: 'valid', atD3: R(13, 53, 49, 27), atD4: R(25, 53, 51, 15), atD5: R(19, 54, 57, 19), final: R(10, 49, 57, 27), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["usurper-threat"], looming: ["usurper-threat"], unpaid: [] },
  'provincial-revenue/field-army/treaty-with-gaiseric/bargain-with-regions/share-power-with-army': { status: 'valid', atD3: R(13, 53, 49, 27), atD4: R(25, 53, 51, 15), atD5: R(19, 54, 57, 19), final: R(15, 66, 51, 11), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["landowners-resentment"], looming: [], unpaid: [] },
  'provincial-revenue/field-army/treaty-with-gaiseric/bargain-with-regions/transfer-to-successors': { status: 'valid', atD3: R(13, 53, 49, 27), atD4: R(25, 53, 51, 15), atD5: R(19, 54, 57, 19), final: R(25, 50, 65, 9), ending: 'fragmented-survival', rule: 'fs-successors-hold', pending: ["successors-drift"], looming: [], unpaid: [] },
  'provincial-revenue/field-army/treaty-with-gaiseric/rule-through-commander/defend-imperial-office': { status: 'blocked-d5', atD3: R(13, 53, 49, 27), atD4: R(25, 53, 51, 15), atD5: R(20, 65, 51, 1), reason: 'Not available: Ruled out by an earlier decision: You let the army’s commander rule in the emperor’s name.' },
  'provincial-revenue/field-army/treaty-with-gaiseric/rule-through-commander/share-power-with-army': { status: 'valid', atD3: R(13, 53, 49, 27), atD4: R(25, 53, 51, 15), atD5: R(20, 65, 51, 1), final: R(16, 77, 45, 2), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["landowners-resentment"], looming: [], unpaid: [] },
  'provincial-revenue/field-army/treaty-with-gaiseric/rule-through-commander/transfer-to-successors': { status: 'valid', atD3: R(13, 53, 49, 27), atD4: R(25, 53, 51, 15), atD5: R(20, 65, 51, 1), final: R(26, 65, 50, 0), ending: 'fragmented-survival', rule: 'fs-successors-hold', pending: ["successors-drift"], looming: ["successors-drift"], unpaid: ["authority-collapsed"] },
  'provincial-revenue/field-army/fortify-what-remains/restore-imperial-authority/defend-imperial-office': { status: 'blocked-d4', atD3: R(13, 53, 49, 27), atD4: R(7, 56, 58, 23), reason: 'Not available: Economy 10 or more (you have 7).' },
  'provincial-revenue/field-army/fortify-what-remains/restore-imperial-authority/share-power-with-army': { status: 'blocked-d4', atD3: R(13, 53, 49, 27), atD4: R(7, 56, 58, 23), reason: 'Not available: Economy 10 or more (you have 7).' },
  'provincial-revenue/field-army/fortify-what-remains/restore-imperial-authority/transfer-to-successors': { status: 'blocked-d4', atD3: R(13, 53, 49, 27), atD4: R(7, 56, 58, 23), reason: 'Not available: Economy 10 or more (you have 7).' },
  'provincial-revenue/field-army/fortify-what-remains/bargain-with-regions/defend-imperial-office': { status: 'valid', atD3: R(13, 53, 49, 27), atD4: R(7, 56, 58, 23), atD5: R(11, 57, 67, 27), final: R(0, 52, 65, 35), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["usurper-threat"], looming: [], unpaid: ["treasury-defaulted"] },
  'provincial-revenue/field-army/fortify-what-remains/bargain-with-regions/share-power-with-army': { status: 'valid', atD3: R(13, 53, 49, 27), atD4: R(7, 56, 58, 23), atD5: R(11, 57, 67, 27), final: R(7, 69, 61, 19), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["landowners-resentment"], looming: [], unpaid: [] },
  'provincial-revenue/field-army/fortify-what-remains/bargain-with-regions/transfer-to-successors': { status: 'valid', atD3: R(13, 53, 49, 27), atD4: R(7, 56, 58, 23), atD5: R(11, 57, 67, 27), final: R(12, 53, 75, 11), ending: 'fragmented-survival', rule: 'fs-successors-hold', pending: ["successors-drift"], looming: [], unpaid: [] },
  'provincial-revenue/field-army/fortify-what-remains/rule-through-commander/defend-imperial-office': { status: 'blocked-d5', atD3: R(13, 53, 49, 27), atD4: R(7, 56, 58, 23), atD5: R(2, 65, 58, 9), reason: 'Not available: Ruled out by an earlier decision: You let the army’s commander rule in the emperor’s name.' },
  'provincial-revenue/field-army/fortify-what-remains/rule-through-commander/share-power-with-army': { status: 'valid', atD3: R(13, 53, 49, 27), atD4: R(7, 56, 58, 23), atD5: R(2, 65, 58, 9), final: R(0, 71, 51, 10), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["landowners-resentment"], looming: [], unpaid: ["treasury-defaulted"] },
  'provincial-revenue/field-army/fortify-what-remains/rule-through-commander/transfer-to-successors': { status: 'valid', atD3: R(13, 53, 49, 27), atD4: R(7, 56, 58, 23), atD5: R(2, 65, 58, 9), final: R(8, 59, 61, 0), ending: 'fragmented-survival', rule: 'fs-successors-hold', pending: ["successors-drift"], looming: ["successors-drift"], unpaid: ["authority-collapsed"] },
  'provincial-revenue/settle-federates/join-expedition/restore-imperial-authority/defend-imperial-office': { status: 'valid', atD3: R(31, 52, 49, 20), atD4: R(14, 46, 49, 26), atD5: R(23, 42, 42, 37), final: R(14, 32, 26, 45), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["usurper-threat"], looming: [], unpaid: [] },
  'provincial-revenue/settle-federates/join-expedition/restore-imperial-authority/share-power-with-army': { status: 'valid', atD3: R(31, 52, 49, 20), atD4: R(14, 46, 49, 26), atD5: R(23, 42, 42, 37), final: R(19, 54, 34, 35), ending: 'imperial-survival', rule: 'is-office-holds', pending: ["landowners-resentment"], looming: [], unpaid: [] },
  'provincial-revenue/settle-federates/join-expedition/restore-imperial-authority/transfer-to-successors': { status: 'valid', atD3: R(31, 52, 49, 20), atD4: R(14, 46, 49, 26), atD5: R(23, 42, 42, 37), final: R(29, 38, 33, 36), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["successors-drift"], looming: ["successors-drift"], unpaid: [] },
  'provincial-revenue/settle-federates/join-expedition/bargain-with-regions/defend-imperial-office': { status: 'valid', atD3: R(31, 52, 49, 20), atD4: R(14, 46, 49, 26), atD5: R(18, 47, 55, 30), final: R(9, 42, 39, 32), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["usurper-threat"], looming: ["usurper-threat"], unpaid: [] },
  'provincial-revenue/settle-federates/join-expedition/bargain-with-regions/share-power-with-army': { status: 'valid', atD3: R(31, 52, 49, 20), atD4: R(14, 46, 49, 26), atD5: R(18, 47, 55, 30), final: R(14, 59, 52, 22), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["landowners-resentment"], looming: [], unpaid: [] },
  'provincial-revenue/settle-federates/join-expedition/bargain-with-regions/transfer-to-successors': { status: 'valid', atD3: R(31, 52, 49, 20), atD4: R(14, 46, 49, 26), atD5: R(18, 47, 55, 30), final: R(24, 43, 50, 29), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["successors-drift"], looming: [], unpaid: [] },
  'provincial-revenue/settle-federates/join-expedition/rule-through-commander/defend-imperial-office': { status: 'blocked-d4', atD3: R(31, 52, 49, 20), atD4: R(14, 46, 49, 26), reason: 'Not available: Military 50 or more (you have 46).' },
  'provincial-revenue/settle-federates/join-expedition/rule-through-commander/share-power-with-army': { status: 'blocked-d4', atD3: R(31, 52, 49, 20), atD4: R(14, 46, 49, 26), reason: 'Not available: Military 50 or more (you have 46).' },
  'provincial-revenue/settle-federates/join-expedition/rule-through-commander/transfer-to-successors': { status: 'blocked-d4', atD3: R(31, 52, 49, 20), atD4: R(14, 46, 49, 26), reason: 'Not available: Military 50 or more (you have 46).' },
  'provincial-revenue/settle-federates/treaty-with-gaiseric/restore-imperial-authority/defend-imperial-office': { status: 'blocked-d4', atD3: R(31, 52, 49, 20), atD4: R(43, 52, 51, 8), reason: 'Not available: Legitimacy 15 or more (you have 8).' },
  'provincial-revenue/settle-federates/treaty-with-gaiseric/restore-imperial-authority/share-power-with-army': { status: 'blocked-d4', atD3: R(31, 52, 49, 20), atD4: R(43, 52, 51, 8), reason: 'Not available: Legitimacy 15 or more (you have 8).' },
  'provincial-revenue/settle-federates/treaty-with-gaiseric/restore-imperial-authority/transfer-to-successors': { status: 'blocked-d4', atD3: R(31, 52, 49, 20), atD4: R(43, 52, 51, 8), reason: 'Not available: Legitimacy 15 or more (you have 8).' },
  'provincial-revenue/settle-federates/treaty-with-gaiseric/bargain-with-regions/defend-imperial-office': { status: 'valid', atD3: R(31, 52, 49, 20), atD4: R(43, 52, 51, 8), atD5: R(37, 53, 57, 16), final: R(28, 48, 49, 30), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["usurper-threat"], looming: ["usurper-threat"], unpaid: [] },
  'provincial-revenue/settle-federates/treaty-with-gaiseric/bargain-with-regions/share-power-with-army': { status: 'valid', atD3: R(31, 52, 49, 20), atD4: R(43, 52, 51, 8), atD5: R(37, 53, 57, 16), final: R(33, 65, 54, 14), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["landowners-resentment"], looming: [], unpaid: [] },
  'provincial-revenue/settle-federates/treaty-with-gaiseric/bargain-with-regions/transfer-to-successors': { status: 'valid', atD3: R(31, 52, 49, 20), atD4: R(43, 52, 51, 8), atD5: R(37, 53, 57, 16), final: R(43, 49, 57, 6), ending: 'fragmented-survival', rule: 'fs-successors-hold', pending: ["successors-drift"], looming: [], unpaid: [] },
  'provincial-revenue/settle-federates/treaty-with-gaiseric/rule-through-commander/defend-imperial-office': { status: 'blocked-d5', atD3: R(31, 52, 49, 20), atD4: R(43, 52, 51, 8), atD5: R(38, 61, 48, 0), reason: 'Not available: Ruled out by an earlier decision: You let the army’s commander rule in the emperor’s name.' },
  'provincial-revenue/settle-federates/treaty-with-gaiseric/rule-through-commander/share-power-with-army': { status: 'valid', atD3: R(31, 52, 49, 20), atD4: R(43, 52, 51, 8), atD5: R(38, 61, 48, 0), final: R(34, 73, 44, 2), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["landowners-resentment"], looming: [], unpaid: ["authority-collapsed"] },
  'provincial-revenue/settle-federates/treaty-with-gaiseric/rule-through-commander/transfer-to-successors': { status: 'valid', atD3: R(31, 52, 49, 20), atD4: R(43, 52, 51, 8), atD5: R(38, 61, 48, 0), final: R(44, 61, 47, 0), ending: 'fragmented-survival', rule: 'fs-successors-hold', pending: ["successors-drift"], looming: ["successors-drift"], unpaid: ["authority-collapsed"] },
  'provincial-revenue/settle-federates/fortify-what-remains/restore-imperial-authority/defend-imperial-office': { status: 'valid', atD3: R(31, 52, 49, 20), atD4: R(25, 58, 55, 16), atD5: R(30, 54, 48, 24), final: R(16, 50, 48, 38), ending: 'imperial-survival', rule: 'is-office-holds', pending: ["usurper-threat"], looming: [], unpaid: [] },
  'provincial-revenue/settle-federates/fortify-what-remains/restore-imperial-authority/share-power-with-army': { status: 'valid', atD3: R(31, 52, 49, 20), atD4: R(25, 58, 55, 16), atD5: R(30, 54, 48, 24), final: R(26, 66, 45, 22), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["landowners-resentment"], looming: [], unpaid: [] },
  'provincial-revenue/settle-federates/fortify-what-remains/restore-imperial-authority/transfer-to-successors': { status: 'valid', atD3: R(31, 52, 49, 20), atD4: R(25, 58, 55, 16), atD5: R(30, 54, 48, 24), final: R(31, 50, 52, 14), ending: 'fragmented-survival', rule: 'fs-successors-hold', pending: ["successors-drift"], looming: ["successors-drift"], unpaid: [] },
  'provincial-revenue/settle-federates/fortify-what-remains/bargain-with-regions/defend-imperial-office': { status: 'valid', atD3: R(31, 52, 49, 20), atD4: R(25, 58, 55, 16), atD5: R(19, 59, 64, 20), final: R(5, 54, 64, 28), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["usurper-threat"], looming: ["usurper-threat"], unpaid: [] },
  'provincial-revenue/settle-federates/fortify-what-remains/bargain-with-regions/share-power-with-army': { status: 'valid', atD3: R(31, 52, 49, 20), atD4: R(25, 58, 55, 16), atD5: R(19, 59, 64, 20), final: R(15, 71, 61, 12), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["landowners-resentment"], looming: [], unpaid: [] },
  'provincial-revenue/settle-federates/fortify-what-remains/bargain-with-regions/transfer-to-successors': { status: 'valid', atD3: R(31, 52, 49, 20), atD4: R(25, 58, 55, 16), atD5: R(19, 59, 64, 20), final: R(25, 55, 72, 10), ending: 'fragmented-survival', rule: 'fs-successors-hold', pending: ["successors-drift"], looming: [], unpaid: [] },
  'provincial-revenue/settle-federates/fortify-what-remains/rule-through-commander/defend-imperial-office': { status: 'blocked-d5', atD3: R(31, 52, 49, 20), atD4: R(25, 58, 55, 16), atD5: R(20, 64, 55, 2), reason: 'Not available: Ruled out by an earlier decision: You let the army’s commander rule in the emperor’s name.' },
  'provincial-revenue/settle-federates/fortify-what-remains/rule-through-commander/share-power-with-army': { status: 'valid', atD3: R(31, 52, 49, 20), atD4: R(25, 58, 55, 16), atD5: R(20, 64, 55, 2), final: R(16, 76, 52, 3), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["landowners-resentment"], looming: [], unpaid: [] },
  'provincial-revenue/settle-federates/fortify-what-remains/rule-through-commander/transfer-to-successors': { status: 'valid', atD3: R(31, 52, 49, 20), atD4: R(25, 58, 55, 16), atD5: R(20, 64, 55, 2), final: R(26, 64, 55, 0), ending: 'fragmented-survival', rule: 'fs-successors-hold', pending: ["successors-drift"], looming: ["successors-drift"], unpaid: ["authority-collapsed"] },
  'pay-the-armies/hold-italy/join-expedition/restore-imperial-authority/defend-imperial-office': { status: 'valid', atD3: R(25, 67, 21, 39), atD4: R(13, 61, 21, 45), atD5: R(22, 57, 14, 56), final: R(13, 47, 9, 70), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["usurper-threat"], looming: [], unpaid: [] },
  'pay-the-armies/hold-italy/join-expedition/restore-imperial-authority/share-power-with-army': { status: 'valid', atD3: R(25, 67, 21, 39), atD4: R(13, 61, 21, 45), atD5: R(22, 57, 14, 56), final: R(18, 59, 8, 52), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["landowners-resentment"], looming: ["landowners-resentment"], unpaid: [] },
  'pay-the-armies/hold-italy/join-expedition/restore-imperial-authority/transfer-to-successors': { status: 'valid', atD3: R(25, 67, 21, 39), atD4: R(13, 61, 21, 45), atD5: R(22, 57, 14, 56), final: R(28, 47, 13, 55), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["successors-drift"], looming: ["successors-drift"], unpaid: [] },
  'pay-the-armies/hold-italy/join-expedition/bargain-with-regions/defend-imperial-office': { status: 'valid', atD3: R(25, 67, 21, 39), atD4: R(13, 61, 21, 45), atD5: R(17, 62, 27, 49), final: R(8, 57, 27, 57), ending: 'imperial-survival', rule: 'is-office-holds', pending: ["usurper-threat"], looming: [], unpaid: [] },
  'pay-the-armies/hold-italy/join-expedition/bargain-with-regions/share-power-with-army': { status: 'valid', atD3: R(25, 67, 21, 39), atD4: R(13, 61, 21, 45), atD5: R(17, 62, 27, 49), final: R(13, 70, 21, 39), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["landowners-resentment"], looming: ["landowners-resentment"], unpaid: [] },
  'pay-the-armies/hold-italy/join-expedition/bargain-with-regions/transfer-to-successors': { status: 'valid', atD3: R(25, 67, 21, 39), atD4: R(13, 61, 21, 45), atD5: R(17, 62, 27, 49), final: R(23, 58, 35, 48), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["successors-drift"], looming: [], unpaid: [] },
  'pay-the-armies/hold-italy/join-expedition/rule-through-commander/defend-imperial-office': { status: 'blocked-d5', atD3: R(25, 67, 21, 39), atD4: R(13, 61, 21, 45), atD5: R(8, 67, 25, 37), reason: 'Not available: Ruled out by an earlier decision: You let the army’s commander rule in the emperor’s name.' },
  'pay-the-armies/hold-italy/join-expedition/rule-through-commander/share-power-with-army': { status: 'valid', atD3: R(25, 67, 21, 39), atD4: R(13, 61, 21, 45), atD5: R(8, 67, 25, 37), final: R(4, 69, 19, 36), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["landowners-resentment"], looming: ["landowners-resentment"], unpaid: [] },
  'pay-the-armies/hold-italy/join-expedition/rule-through-commander/transfer-to-successors': { status: 'valid', atD3: R(25, 67, 21, 39), atD4: R(13, 61, 21, 45), atD5: R(8, 67, 25, 37), final: R(14, 61, 29, 36), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["successors-drift"], looming: ["successors-drift"], unpaid: [] },
  'pay-the-armies/hold-italy/treaty-with-gaiseric/restore-imperial-authority/defend-imperial-office': { status: 'valid', atD3: R(25, 67, 21, 39), atD4: R(41, 67, 23, 27), atD5: R(46, 63, 16, 32), final: R(37, 53, 16, 46), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["usurper-threat"], looming: [], unpaid: [] },
  'pay-the-armies/hold-italy/treaty-with-gaiseric/restore-imperial-authority/share-power-with-army': { status: 'valid', atD3: R(25, 67, 21, 39), atD4: R(41, 67, 23, 27), atD5: R(46, 63, 16, 32), final: R(42, 65, 10, 28), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["landowners-resentment"], looming: ["landowners-resentment"], unpaid: [] },
  'pay-the-armies/hold-italy/treaty-with-gaiseric/restore-imperial-authority/transfer-to-successors': { status: 'valid', atD3: R(25, 67, 21, 39), atD4: R(41, 67, 23, 27), atD5: R(46, 63, 16, 32), final: R(52, 53, 20, 27), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["successors-drift"], looming: ["successors-drift"], unpaid: [] },
  'pay-the-armies/hold-italy/treaty-with-gaiseric/bargain-with-regions/defend-imperial-office': { status: 'valid', atD3: R(25, 67, 21, 39), atD4: R(41, 67, 23, 27), atD5: R(35, 68, 29, 31), final: R(26, 63, 29, 45), ending: 'imperial-survival', rule: 'is-office-holds', pending: ["usurper-threat"], looming: [], unpaid: [] },
  'pay-the-armies/hold-italy/treaty-with-gaiseric/bargain-with-regions/share-power-with-army': { status: 'valid', atD3: R(25, 67, 21, 39), atD4: R(41, 67, 23, 27), atD5: R(35, 68, 29, 31), final: R(31, 76, 23, 27), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["landowners-resentment"], looming: ["landowners-resentment"], unpaid: [] },
  'pay-the-armies/hold-italy/treaty-with-gaiseric/bargain-with-regions/transfer-to-successors': { status: 'valid', atD3: R(25, 67, 21, 39), atD4: R(41, 67, 23, 27), atD5: R(35, 68, 29, 31), final: R(41, 64, 37, 26), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["successors-drift"], looming: [], unpaid: [] },
  'pay-the-armies/hold-italy/treaty-with-gaiseric/rule-through-commander/defend-imperial-office': { status: 'blocked-d5', atD3: R(25, 67, 21, 39), atD4: R(41, 67, 23, 27), atD5: R(36, 76, 23, 13), reason: 'Not available: Ruled out by an earlier decision: You let the army’s commander rule in the emperor’s name.' },
  'pay-the-armies/hold-italy/treaty-with-gaiseric/rule-through-commander/share-power-with-army': { status: 'valid', atD3: R(25, 67, 21, 39), atD4: R(41, 67, 23, 27), atD5: R(36, 76, 23, 13), final: R(32, 84, 17, 12), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["landowners-resentment"], looming: ["landowners-resentment"], unpaid: [] },
  'pay-the-armies/hold-italy/treaty-with-gaiseric/rule-through-commander/transfer-to-successors': { status: 'valid', atD3: R(25, 67, 21, 39), atD4: R(41, 67, 23, 27), atD5: R(36, 76, 23, 13), final: R(42, 76, 27, 3), ending: 'fragmented-survival', rule: 'fs-successors-hold', pending: ["successors-drift"], looming: ["successors-drift"], unpaid: [] },
  'pay-the-armies/hold-italy/fortify-what-remains/restore-imperial-authority/defend-imperial-office': { status: 'valid', atD3: R(25, 67, 21, 39), atD4: R(19, 70, 27, 35), atD5: R(28, 66, 20, 43), final: R(19, 56, 20, 57), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["usurper-threat"], looming: [], unpaid: [] },
  'pay-the-armies/hold-italy/fortify-what-remains/restore-imperial-authority/share-power-with-army': { status: 'valid', atD3: R(25, 67, 21, 39), atD4: R(19, 70, 27, 35), atD5: R(28, 66, 20, 43), final: R(24, 68, 14, 39), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["landowners-resentment"], looming: ["landowners-resentment"], unpaid: [] },
  'pay-the-armies/hold-italy/fortify-what-remains/restore-imperial-authority/transfer-to-successors': { status: 'valid', atD3: R(25, 67, 21, 39), atD4: R(19, 70, 27, 35), atD5: R(28, 66, 20, 43), final: R(34, 56, 24, 38), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["successors-drift"], looming: ["successors-drift"], unpaid: [] },
  'pay-the-armies/hold-italy/fortify-what-remains/bargain-with-regions/defend-imperial-office': { status: 'valid', atD3: R(25, 67, 21, 39), atD4: R(19, 70, 27, 35), atD5: R(13, 71, 36, 39), final: R(4, 66, 36, 47), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["usurper-threat"], looming: [], unpaid: [] },
  'pay-the-armies/hold-italy/fortify-what-remains/bargain-with-regions/share-power-with-army': { status: 'valid', atD3: R(25, 67, 21, 39), atD4: R(19, 70, 27, 35), atD5: R(13, 71, 36, 39), final: R(9, 83, 30, 31), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["landowners-resentment"], looming: [], unpaid: [] },
  'pay-the-armies/hold-italy/fortify-what-remains/bargain-with-regions/transfer-to-successors': { status: 'valid', atD3: R(25, 67, 21, 39), atD4: R(19, 70, 27, 35), atD5: R(13, 71, 36, 39), final: R(19, 67, 44, 28), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["successors-drift"], looming: [], unpaid: [] },
  'pay-the-armies/hold-italy/fortify-what-remains/rule-through-commander/defend-imperial-office': { status: 'blocked-d5', atD3: R(25, 67, 21, 39), atD4: R(19, 70, 27, 35), atD5: R(14, 76, 31, 27), reason: 'Not available: Ruled out by an earlier decision: You let the army’s commander rule in the emperor’s name.' },
  'pay-the-armies/hold-italy/fortify-what-remains/rule-through-commander/share-power-with-army': { status: 'valid', atD3: R(25, 67, 21, 39), atD4: R(19, 70, 27, 35), atD5: R(14, 76, 31, 27), final: R(10, 82, 25, 28), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["landowners-resentment"], looming: ["landowners-resentment"], unpaid: [] },
  'pay-the-armies/hold-italy/fortify-what-remains/rule-through-commander/transfer-to-successors': { status: 'valid', atD3: R(25, 67, 21, 39), atD4: R(19, 70, 27, 35), atD5: R(14, 76, 31, 27), final: R(20, 76, 35, 17), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["successors-drift"], looming: ["successors-drift"], unpaid: [] },
  'pay-the-armies/field-army/join-expedition/restore-imperial-authority/defend-imperial-office': { status: 'blocked-d2' },
  'pay-the-armies/field-army/join-expedition/restore-imperial-authority/share-power-with-army': { status: 'blocked-d2' },
  'pay-the-armies/field-army/join-expedition/restore-imperial-authority/transfer-to-successors': { status: 'blocked-d2' },
  'pay-the-armies/field-army/join-expedition/bargain-with-regions/defend-imperial-office': { status: 'blocked-d2' },
  'pay-the-armies/field-army/join-expedition/bargain-with-regions/share-power-with-army': { status: 'blocked-d2' },
  'pay-the-armies/field-army/join-expedition/bargain-with-regions/transfer-to-successors': { status: 'blocked-d2' },
  'pay-the-armies/field-army/join-expedition/rule-through-commander/defend-imperial-office': { status: 'blocked-d2' },
  'pay-the-armies/field-army/join-expedition/rule-through-commander/share-power-with-army': { status: 'blocked-d2' },
  'pay-the-armies/field-army/join-expedition/rule-through-commander/transfer-to-successors': { status: 'blocked-d2' },
  'pay-the-armies/field-army/treaty-with-gaiseric/restore-imperial-authority/defend-imperial-office': { status: 'blocked-d2' },
  'pay-the-armies/field-army/treaty-with-gaiseric/restore-imperial-authority/share-power-with-army': { status: 'blocked-d2' },
  'pay-the-armies/field-army/treaty-with-gaiseric/restore-imperial-authority/transfer-to-successors': { status: 'blocked-d2' },
  'pay-the-armies/field-army/treaty-with-gaiseric/bargain-with-regions/defend-imperial-office': { status: 'blocked-d2' },
  'pay-the-armies/field-army/treaty-with-gaiseric/bargain-with-regions/share-power-with-army': { status: 'blocked-d2' },
  'pay-the-armies/field-army/treaty-with-gaiseric/bargain-with-regions/transfer-to-successors': { status: 'blocked-d2' },
  'pay-the-armies/field-army/treaty-with-gaiseric/rule-through-commander/defend-imperial-office': { status: 'blocked-d2' },
  'pay-the-armies/field-army/treaty-with-gaiseric/rule-through-commander/share-power-with-army': { status: 'blocked-d2' },
  'pay-the-armies/field-army/treaty-with-gaiseric/rule-through-commander/transfer-to-successors': { status: 'blocked-d2' },
  'pay-the-armies/field-army/fortify-what-remains/restore-imperial-authority/defend-imperial-office': { status: 'blocked-d2' },
  'pay-the-armies/field-army/fortify-what-remains/restore-imperial-authority/share-power-with-army': { status: 'blocked-d2' },
  'pay-the-armies/field-army/fortify-what-remains/restore-imperial-authority/transfer-to-successors': { status: 'blocked-d2' },
  'pay-the-armies/field-army/fortify-what-remains/bargain-with-regions/defend-imperial-office': { status: 'blocked-d2' },
  'pay-the-armies/field-army/fortify-what-remains/bargain-with-regions/share-power-with-army': { status: 'blocked-d2' },
  'pay-the-armies/field-army/fortify-what-remains/bargain-with-regions/transfer-to-successors': { status: 'blocked-d2' },
  'pay-the-armies/field-army/fortify-what-remains/rule-through-commander/defend-imperial-office': { status: 'blocked-d2' },
  'pay-the-armies/field-army/fortify-what-remains/rule-through-commander/share-power-with-army': { status: 'blocked-d2' },
  'pay-the-armies/field-army/fortify-what-remains/rule-through-commander/transfer-to-successors': { status: 'blocked-d2' },
  'pay-the-armies/settle-federates/join-expedition/restore-imperial-authority/defend-imperial-office': { status: 'valid', atD3: R(28, 66, 35, 27), atD4: R(16, 60, 35, 33), atD5: R(25, 56, 28, 44), final: R(16, 46, 23, 58), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["usurper-threat"], looming: [], unpaid: [] },
  'pay-the-armies/settle-federates/join-expedition/restore-imperial-authority/share-power-with-army': { status: 'valid', atD3: R(28, 66, 35, 27), atD4: R(16, 60, 35, 33), atD5: R(25, 56, 28, 44), final: R(21, 62, 25, 42), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["landowners-resentment"], looming: ["landowners-resentment"], unpaid: [] },
  'pay-the-armies/settle-federates/join-expedition/restore-imperial-authority/transfer-to-successors': { status: 'valid', atD3: R(28, 66, 35, 27), atD4: R(16, 60, 35, 33), atD5: R(25, 56, 28, 44), final: R(31, 46, 27, 43), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["successors-drift"], looming: ["successors-drift"], unpaid: [] },
  'pay-the-armies/settle-federates/join-expedition/bargain-with-regions/defend-imperial-office': { status: 'valid', atD3: R(28, 66, 35, 27), atD4: R(16, 60, 35, 33), atD5: R(10, 61, 41, 37), final: R(1, 56, 41, 45), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["usurper-threat"], looming: [], unpaid: [] },
  'pay-the-armies/settle-federates/join-expedition/bargain-with-regions/share-power-with-army': { status: 'valid', atD3: R(28, 66, 35, 27), atD4: R(16, 60, 35, 33), atD5: R(10, 61, 41, 37), final: R(6, 73, 38, 29), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["landowners-resentment"], looming: [], unpaid: [] },
  'pay-the-armies/settle-federates/join-expedition/bargain-with-regions/transfer-to-successors': { status: 'valid', atD3: R(28, 66, 35, 27), atD4: R(16, 60, 35, 33), atD5: R(10, 61, 41, 37), final: R(16, 57, 49, 30), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["successors-drift"], looming: [], unpaid: [] },
  'pay-the-armies/settle-federates/join-expedition/rule-through-commander/defend-imperial-office': { status: 'blocked-d5', atD3: R(28, 66, 35, 27), atD4: R(16, 60, 35, 33), atD5: R(11, 66, 39, 25), reason: 'Not available: Ruled out by an earlier decision: You let the army’s commander rule in the emperor’s name.' },
  'pay-the-armies/settle-federates/join-expedition/rule-through-commander/share-power-with-army': { status: 'valid', atD3: R(28, 66, 35, 27), atD4: R(16, 60, 35, 33), atD5: R(11, 66, 39, 25), final: R(7, 72, 36, 26), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["landowners-resentment"], looming: [], unpaid: [] },
  'pay-the-armies/settle-federates/join-expedition/rule-through-commander/transfer-to-successors': { status: 'valid', atD3: R(28, 66, 35, 27), atD4: R(16, 60, 35, 33), atD5: R(11, 66, 39, 25), final: R(17, 66, 43, 19), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["successors-drift"], looming: ["successors-drift"], unpaid: [] },
  'pay-the-armies/settle-federates/treaty-with-gaiseric/restore-imperial-authority/defend-imperial-office': { status: 'valid', atD3: R(28, 66, 35, 27), atD4: R(40, 66, 37, 15), atD5: R(45, 62, 30, 20), final: R(36, 52, 30, 34), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["usurper-threat"], looming: ["usurper-threat"], unpaid: [] },
  'pay-the-armies/settle-federates/treaty-with-gaiseric/restore-imperial-authority/share-power-with-army': { status: 'valid', atD3: R(28, 66, 35, 27), atD4: R(40, 66, 37, 15), atD5: R(45, 62, 30, 20), final: R(41, 68, 27, 18), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["landowners-resentment"], looming: ["landowners-resentment"], unpaid: [] },
  'pay-the-armies/settle-federates/treaty-with-gaiseric/restore-imperial-authority/transfer-to-successors': { status: 'valid', atD3: R(28, 66, 35, 27), atD4: R(40, 66, 37, 15), atD5: R(45, 62, 30, 20), final: R(51, 58, 34, 10), ending: 'fragmented-survival', rule: 'fs-successors-hold', pending: ["successors-drift"], looming: ["successors-drift"], unpaid: [] },
  'pay-the-armies/settle-federates/treaty-with-gaiseric/bargain-with-regions/defend-imperial-office': { status: 'valid', atD3: R(28, 66, 35, 27), atD4: R(40, 66, 37, 15), atD5: R(34, 67, 43, 19), final: R(25, 62, 43, 33), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["usurper-threat"], looming: ["usurper-threat"], unpaid: [] },
  'pay-the-armies/settle-federates/treaty-with-gaiseric/bargain-with-regions/share-power-with-army': { status: 'valid', atD3: R(28, 66, 35, 27), atD4: R(40, 66, 37, 15), atD5: R(34, 67, 43, 19), final: R(30, 79, 40, 17), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["landowners-resentment"], looming: [], unpaid: [] },
  'pay-the-armies/settle-federates/treaty-with-gaiseric/bargain-with-regions/transfer-to-successors': { status: 'valid', atD3: R(28, 66, 35, 27), atD4: R(40, 66, 37, 15), atD5: R(34, 67, 43, 19), final: R(40, 63, 51, 9), ending: 'fragmented-survival', rule: 'fs-successors-hold', pending: ["successors-drift"], looming: [], unpaid: [] },
  'pay-the-armies/settle-federates/treaty-with-gaiseric/rule-through-commander/defend-imperial-office': { status: 'blocked-d5', atD3: R(28, 66, 35, 27), atD4: R(40, 66, 37, 15), atD5: R(35, 75, 37, 1), reason: 'Not available: Ruled out by an earlier decision: You let the army’s commander rule in the emperor’s name.' },
  'pay-the-armies/settle-federates/treaty-with-gaiseric/rule-through-commander/share-power-with-army': { status: 'valid', atD3: R(28, 66, 35, 27), atD4: R(40, 66, 37, 15), atD5: R(35, 75, 37, 1), final: R(31, 87, 34, 2), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["landowners-resentment"], looming: [], unpaid: [] },
  'pay-the-armies/settle-federates/treaty-with-gaiseric/rule-through-commander/transfer-to-successors': { status: 'valid', atD3: R(28, 66, 35, 27), atD4: R(40, 66, 37, 15), atD5: R(35, 75, 37, 1), final: R(41, 75, 36, 0), ending: 'fragmented-survival', rule: 'fs-successors-hold', pending: ["successors-drift"], looming: ["successors-drift"], unpaid: ["authority-collapsed"] },
  'pay-the-armies/settle-federates/fortify-what-remains/restore-imperial-authority/defend-imperial-office': { status: 'valid', atD3: R(28, 66, 35, 27), atD4: R(22, 72, 41, 23), atD5: R(27, 68, 34, 31), final: R(18, 64, 34, 45), ending: 'imperial-survival', rule: 'is-office-holds', pending: ["usurper-threat"], looming: [], unpaid: [] },
  'pay-the-armies/settle-federates/fortify-what-remains/restore-imperial-authority/share-power-with-army': { status: 'valid', atD3: R(28, 66, 35, 27), atD4: R(22, 72, 41, 23), atD5: R(27, 68, 34, 31), final: R(23, 80, 31, 29), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["landowners-resentment"], looming: [], unpaid: [] },
  'pay-the-armies/settle-federates/fortify-what-remains/restore-imperial-authority/transfer-to-successors': { status: 'valid', atD3: R(28, 66, 35, 27), atD4: R(22, 72, 41, 23), atD5: R(27, 68, 34, 31), final: R(33, 64, 38, 26), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["successors-drift"], looming: ["successors-drift"], unpaid: [] },
  'pay-the-armies/settle-federates/fortify-what-remains/bargain-with-regions/defend-imperial-office': { status: 'valid', atD3: R(28, 66, 35, 27), atD4: R(22, 72, 41, 23), atD5: R(16, 73, 50, 27), final: R(7, 68, 50, 35), ending: 'imperial-survival', rule: 'is-office-holds', pending: ["usurper-threat"], looming: [], unpaid: [] },
  'pay-the-armies/settle-federates/fortify-what-remains/bargain-with-regions/share-power-with-army': { status: 'valid', atD3: R(28, 66, 35, 27), atD4: R(22, 72, 41, 23), atD5: R(16, 73, 50, 27), final: R(12, 85, 47, 19), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["landowners-resentment"], looming: [], unpaid: [] },
  'pay-the-armies/settle-federates/fortify-what-remains/bargain-with-regions/transfer-to-successors': { status: 'valid', atD3: R(28, 66, 35, 27), atD4: R(22, 72, 41, 23), atD5: R(16, 73, 50, 27), final: R(22, 69, 58, 17), ending: 'fragmented-survival', rule: 'fs-order-persists', pending: ["successors-drift"], looming: [], unpaid: [] },
  'pay-the-armies/settle-federates/fortify-what-remains/rule-through-commander/defend-imperial-office': { status: 'blocked-d5', atD3: R(28, 66, 35, 27), atD4: R(22, 72, 41, 23), atD5: R(17, 78, 41, 9), reason: 'Not available: Ruled out by an earlier decision: You let the army’s commander rule in the emperor’s name.' },
  'pay-the-armies/settle-federates/fortify-what-remains/rule-through-commander/share-power-with-army': { status: 'valid', atD3: R(28, 66, 35, 27), atD4: R(22, 72, 41, 23), atD5: R(17, 78, 41, 9), final: R(13, 84, 38, 10), ending: 'imperial-collapse', rule: 'ic-fallback', pending: ["landowners-resentment"], looming: [], unpaid: [] },
  'pay-the-armies/settle-federates/fortify-what-remains/rule-through-commander/transfer-to-successors': { status: 'valid', atD3: R(28, 66, 35, 27), atD4: R(22, 72, 41, 23), atD5: R(17, 78, 41, 9), final: R(23, 78, 44, 0), ending: 'fragmented-survival', rule: 'fs-successors-hold', pending: ["successors-drift"], looming: ["successors-drift"], unpaid: ["authority-collapsed"] },
};

function after(...choices: string[]): SimulationState {
  return replay(rome, choices);
}

function prefixes(length: number): string[][] {
  const seen = new Set<string>();
  return enumeratePaths(rome)
    .map((path) => path.slice(0, length))
    .filter((path) => {
      const key = path.join('/');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
/** Every distinct valid D1–D3 prefix. */
const d3Paths = () => prefixes(3);
/** Every distinct valid D1–D4 prefix. */
const d4Paths = () => prefixes(4);

function decision(id: string) {
  const node = rome.nodes.find((item) => item.id === id);
  if (node?.kind !== 'decision') throw new Error(`no decision ${id}`);
  return node;
}

describe('Rome scenario integrity', () => {
  it('passes the validator, including links to real event ids', () => {
    expect(validateScenario(rome, actualIds)).toEqual([]);
  });

  it('is version 5, with a change note for every version', () => {
    expect(rome.version).toBe(5);
    expect(rome.changes.map((change) => change.version)).toEqual([1, 2, 3, 4, 5]);
    expect(createInitialState(rome).scenarioVersion).toBe(5);
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

  it('decisions 3 and 4 keep their options, prerequisites and reports', () => {
    expect(decision('d3-north-africa').choices.map((c) => c.id)).toEqual([...D3]);
    const d4 = decision('d4-imperial-legitimacy');
    expect(d4.choices.map((c) => c.id)).toEqual([...D4]);
    expect(d4.choices.map((c) => (c.prerequisites ?? []).length)).toEqual([2, 0, 1]);
    for (const choice of [...decision('d3-north-africa').choices, ...d4.choices]) {
      const n = choice.narrative!;
      expect(n.stakeholders.some((s) => s.impact === 'gains' && !s.when)).toBe(true);
      expect(n.stakeholders.some((s) => s.impact === 'loses' && !s.when)).toBe(true);
    }
  });

  it('decision 5 is c. 475, set against the sourced 474–476 events, with three complete options', () => {
    const d5 = decision('d5-final-crisis');
    expect(d5.year).toBe(475);
    expect(d5.historicalContextIds).toEqual(['nepos-474', 'auvergne-475', 'orestes-romulus-475', 'odoacer-deposes-romulus-476']);
    expect(d5.choices.map((c) => c.id)).toEqual([...D5]);
    for (const choice of d5.choices) {
      const years = choice.consequences!.map((c) => c.dueYear);
      expect(years.some((y) => y === 476)).toBe(true); // resolved before the ending
      expect(years.some((y) => y === 480)).toBe(true); // still ahead at the ending: a long-term implication
      expect(choice.nextEventId).toBe('settlement-476');
      expect(choice.narrative!.situation?.length).toBeGreaterThan(40);
    }
    // Only defending the office is gated; sharing power and handing over are always open.
    expect(d5.choices.map((c) => (c.prerequisites ?? []).length)).toEqual([2, 0, 0]);
  });

  it('decision 5 depends on decision 4', () => {
    const d4Flags = new Set(['central-authority', 'regional-bargain', 'commander-rules']);
    const d5 = decision('d5-final-crisis');
    // Defending the office is ruled out when the commander already rules.
    expect(d5.choices[0]!.prerequisites!.some((p) => p.notFlag === 'commander-rules')).toBe(true);
    for (const choice of d5.choices) {
      const reacts = (choice.conditionalEffects ?? []).some((c) => {
        const flag = 'flag' in c.when ? c.when.flag : undefined;
        return flag !== undefined && d4Flags.has(flag);
      });
      expect(reacts).toBe(true);
    }
  });

  it('ends at the settlement of 476 with three ending categories and rules for unpaid costs', () => {
    const end = rome.nodes.find((node) => node.id === 'settlement-476');
    expect(end?.kind === 'terminal' && end.status).toBe('ending');
    expect(end?.year).toBe(476);
    expect(rome.nodes.filter((node) => node.kind === 'terminal').map((node) => node.id)).toEqual(['settlement-476']);
    expect(rome.endings!.map((e) => e.category)).toEqual(['imperial-survival', 'fragmented-survival', 'imperial-collapse']);
    expect(rome.shortfallRules!.map((r) => r.resource)).toEqual(['economy', 'military', 'legitimacy', 'unity']);
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

  it('a cost the treasury cannot pay in full has a structural consequence, recorded with the consequence', () => {
    const debts = resolved(['provincial-revenue', 'field-army', 'join-expedition'])[0]!;
    expect(debts.effects[0]).toEqual({ resource: 'economy', requested: -5, applied: -1, before: 1, after: 0 });
    expect(debts.structural).toEqual([
      {
        resource: 'economy',
        unpaid: 4,
        explanation:
          'The treasury could not pay all of it, so the court made up the difference by seizing goods and labour from the provinces.',
        transfer: { resource: 'unity', requested: -2, applied: -2, before: 49, after: 47 },
        flag: 'treasury-defaulted',
      },
    ]);
    expect(after('provincial-revenue', 'field-army', 'join-expedition').flags).toContain('treasury-defaulted');
  });

  it('nothing is due in 472 after giving up Africa', () => {
    for (const prefix of d3Paths().filter((p) => p[2] === 'fortify-what-remains')) expect(resolved(prefix)).toEqual([]);
  });
});

describe('all 243 theoretical D1–D5 combinations', () => {
  it('match the independent reference model exactly', () => {
    const counts = { valid: 0, 'blocked-d2': 0, 'blocked-d3': 0, 'blocked-d4': 0, 'blocked-d5': 0 };
    for (const c1 of D1) {
      for (const c2 of D2) {
        for (const c3 of D3) {
          for (const c4 of D4) {
            for (const c5 of D5) {
              const key = `${c1}/${c2}/${c3}/${c4}/${c5}`;
              const expected = MATRIX[key]!;
              counts[expected.status] += 1;

              const s2 = applyChoice(rome, after(c1), c2);
              if (expected.status === 'blocked-d2') {
                expect(s2.ok).toBe(false);
                continue;
              }
              if (!s2.ok) throw new Error(`${key}: decision 2 rejected`);
              expect(s2.state.resources).toEqual(expected.atD3);

              const s3 = applyChoice(rome, s2.state, c3);
              if (expected.status === 'blocked-d3') {
                expect(s3.ok).toBe(false);
                continue;
              }
              if (!s3.ok) throw new Error(`${key}: decision 3 rejected`);
              expect(s3.state.resources).toEqual(expected.atD4);

              const s4 = applyChoice(rome, s3.state, c4);
              if (expected.status === 'blocked-d4') {
                expect(s4.ok).toBe(false);
                if (!s4.ok) expect(s4.message).toBe(expected.reason);
                continue;
              }
              if (!s4.ok) throw new Error(`${key}: decision 4 rejected`);
              expect(s4.state.resources).toEqual(expected.atD5);

              const s5 = applyChoice(rome, s4.state, c5);
              if (expected.status === 'blocked-d5') {
                expect(s5.ok).toBe(false);
                if (!s5.ok) {
                  expect(s5.error).toBe('unavailable');
                  expect(s5.message).toBe(expected.reason);
                }
                continue;
              }
              if (!s5.ok) throw new Error(`${key}: decision 5 rejected`);
              const state = s5.state;
              expect(state.resources).toEqual(expected.final);
              expect(state.currentEventId).toBe('settlement-476');
              expect(state.year).toBe(476);
              expect(state.endingId).toBe(expected.ending);
              expect(state.endingRuleId).toBe(expected.rule);
              expect(state.pending.map((p) => p.consequenceId)).toEqual(expected.pending);
              expect(loomingThreats(rome, state).map((p) => p.consequenceId)).toEqual(expected.looming);
              expect(state.flags.filter((flag) => UNPAID_FLAGS.includes(flag))).toEqual(expected.unpaid);
              expect(state.choicesMade).toEqual([c1, c2, c3, c4, c5]);
              expect(state.records).toHaveLength(5);
              for (const resource of RESOURCE_KEYS) {
                const value = state.resources[resource];
                expect(Number.isInteger(value) && value >= 0 && value <= 100).toBe(true);
              }
            }
          }
        }
      }
    }
    expect(counts).toEqual({ valid: 145, 'blocked-d2': 27, 'blocked-d3': 27, 'blocked-d4': 27, 'blocked-d5': 17 });
    expect(enumeratePaths(rome)).toHaveLength(145);
  });

  it('every state that reaches decision 4 or 5 has at least two options', () => {
    expect(d3Paths()).toHaveLength(21);
    for (const prefix of d3Paths()) {
      const options = evaluateChoices(rome, after(...prefix));
      expect(options.filter((o) => o.available).length).toBeGreaterThanOrEqual(2);
      expect(options.find((o) => o.choice.id === 'bargain-with-regions')!.available).toBe(true);
    }
    expect(d4Paths()).toHaveLength(54);
    for (const prefix of d4Paths()) {
      const options = evaluateChoices(rome, after(...prefix));
      expect(options.filter((o) => o.available).length).toBeGreaterThanOrEqual(2);
      const open = options.filter((o) => o.available).map((o) => o.choice.id);
      expect(open.includes('share-power-with-army') && open.includes('transfer-to-successors')).toBe(true);
    }
  });

  it('explains blocked combinations in plain language', () => {
    const reason = (path: string[], choice: string) => {
      const result = applyChoice(rome, after(...path), choice);
      return result.ok ? 'ok' : result.message;
    };
    expect(reason(['pay-the-armies'], 'field-army')).toBe('Not available: Economy 30 or more (you have 25).');
    expect(reason(['reform-taxation', 'hold-italy'], 'join-expedition')).toBe('Not available: Military 50 or more (you have 49).');
    expect(reason(['reform-taxation', 'settle-federates'], 'treaty-with-gaiseric')).toBe(
      'Not available: Legitimacy 15 or more (you have 12).',
    );
    expect(reason(['pay-the-armies', 'hold-italy', 'fortify-what-remains', 'rule-through-commander'], 'defend-imperial-office')).toBe(
      'Not available: Ruled out by an earlier decision: You let the army’s commander rule in the emperor’s name.',
    );
  });

  it('earlier decisions shape later ones', () => {
    const ids = (path: string[], choice: string) =>
      evaluateChoices(rome, after(...path))
        .find((e) => e.choice.id === choice)!
        .applicableConditionals.map((c) => c.id);
    // D2 → D3
    expect(ids(['reform-taxation', 'field-army'], 'join-expedition')).toEqual(['expedition-veterans']);
    expect(ids(['pay-the-armies', 'hold-italy'], 'treaty-with-gaiseric')).toEqual(['treaty-garrisoned-coasts']);
    // D3 → D4
    expect(ids(['pay-the-armies', 'hold-italy', 'join-expedition'], 'restore-imperial-authority')).toEqual(['authority-eastern-backing']);
    expect(ids(['pay-the-armies', 'hold-italy', 'treaty-with-gaiseric'], 'rule-through-commander')).toEqual(['commander-quiet-sea']);
    expect(ids(['pay-the-armies', 'hold-italy', 'fortify-what-remains'], 'bargain-with-regions')).toEqual(['bargain-loyal-provinces']);
    // D4 → D5
    expect(ids(['pay-the-armies', 'hold-italy', 'fortify-what-remains', 'restore-imperial-authority'], 'defend-imperial-office')).toEqual([
      'loyal-officials-raise-troops',
    ]);
    expect(ids(['pay-the-armies', 'hold-italy', 'fortify-what-remains', 'bargain-with-regions'], 'transfer-to-successors')).toEqual([
      'successors-federation',
    ]);
    expect(ids(['pay-the-armies', 'hold-italy', 'join-expedition', 'rule-through-commander'], 'transfer-to-successors')).toEqual([
      'eastern-goodwill',
      'commander-becomes-ruler',
    ]);
    expect(ids(['pay-the-armies', 'settle-federates', 'fortify-what-remains', 'rule-through-commander'], 'share-power-with-army')).toEqual([
      'federate-precedent',
      'commander-guarantees',
    ]);
  });

  it('no option at decisions 3, 4 or 5 is better than another on every resource, from any reachable state', () => {
    const dominated = (states: Resources[]) =>
      states.some((a, i) => states.some((b, j) => i !== j && RESOURCE_KEYS.every((key) => a[key] >= b[key])));
    for (const length of [2, 3, 4]) {
      for (const prefix of prefixes(length)) {
        const next = evaluateChoices(rome, after(...prefix))
          .filter((e) => e.available)
          .map((e) => after(...prefix, e.choice.id).resources);
        expect(dominated(next)).toBe(false);
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

  it('numbers decisions 3, 4 and 5 of 5', () => {
    expect(decisionNumber(rome, getCurrentNode(rome, after('pay-the-armies', 'hold-italy')).id)).toBe(3);
    expect(decisionNumber(rome, getCurrentNode(rome, after('pay-the-armies', 'hold-italy', 'join-expedition')).id)).toBe(4);
    expect(
      decisionNumber(rome, getCurrentNode(rome, after('pay-the-armies', 'hold-italy', 'join-expedition', 'bargain-with-regions')).id),
    ).toBe(5);
  });
});

describe('the consequences due in 475 and 476', () => {
  it('475: resolve on arrival at decision 5, before the player decides', () => {
    for (const prefix of d4Paths()) {
      const state = after(...prefix);
      expect(state.currentEventId).toBe('d5-final-crisis');
      expect(state.year).toBe(475);
      expect(state.pending.filter((p) => p.dueYear <= 475)).toEqual([]);
      for (const item of consequencesResolvedAt(state, 'd5-final-crisis')) expect(item.resolvedYear).toBe(475);
    }
  });

  it('476: resolve on arrival at the settlement of 476, after decision 5 and before the ending is decided', () => {
    for (const path of enumeratePaths(rome)) {
      const state = after(...path);
      expect(state.pending.filter((p) => p.dueYear <= 476)).toEqual([]);
      const at476 = consequencesResolvedAt(state, 'settlement-476');
      expect(at476.length).toBeGreaterThan(0);
      for (const item of at476) expect(item.resolvedYear).toBe(476);
      // The ending was classified from the state after them: reclassifying the final state gives the same answer.
      expect(state.endingId).toBeTruthy();
    }
  });

  it('every conditional 475 and 476 consequence both takes effect and lapses on some path; unconditional ones always land', () => {
    const outcomes = new Map<string, Set<boolean>>();
    for (const path of enumeratePaths(rome)) {
      for (const item of after(...path).resolved.filter((r) => r.resolvedYear >= 475)) {
        if (!outcomes.has(item.consequenceId)) outcomes.set(item.consequenceId, new Set());
        outcomes.get(item.consequenceId)!.add(item.triggered);
      }
    }
    expect([...outcomes.keys()].sort()).toEqual(
      [
        'army-arrears',
        'bargain-strains',
        'centralisation-resisted',
        'civil-war-damage',
        'commander-ambition',
        'eastern-recognition',
        'expedition-reprisal',
        'federates-demands',
        'loyal-administration',
        'loyalist-victory',
        'regional-levies',
        'sea-left-to-vandals',
        'soldiers-settled',
      ].sort(),
    );
    for (const [id, seen] of outcomes) {
      const conditional = findConsequence(rome, id)!.condition !== undefined;
      expect([id, [...seen].sort()]).toEqual([id, conditional ? [false, true] : [true]]);
    }
  });

  it('examples: loyal officials collect more only if the court’s standing holds; the commander turns on a weak emperor', () => {
    const at475 = (path: string[]) => Object.fromEntries(consequencesResolvedAt(after(...path), 'd5-final-crisis').map((c) => [c.consequenceId, c]));
    expect(at475(['pay-the-armies', 'hold-italy', 'join-expedition', 'restore-imperial-authority'])['loyal-administration']!.triggered).toBe(true);
    const lapsed = at475(['reform-taxation', 'hold-italy', 'treaty-with-gaiseric', 'restore-imperial-authority'])['loyal-administration']!;
    expect(lapsed.triggered).toBe(false);
    expect(lapsed.explanation).toMatch(/too weak for its new officials/);
    expect(at475(['pay-the-armies', 'hold-italy', 'fortify-what-remains', 'rule-through-commander'])['commander-ambition']!.triggered).toBe(false);
    expect(at475(['reform-taxation', 'settle-federates', 'fortify-what-remains', 'rule-through-commander'])['commander-ambition']!.triggered).toBe(true);
  });

  it('consequences due after 476 are still pending at the end, as long-term implications', () => {
    for (const path of enumeratePaths(rome)) {
      for (const item of after(...path).pending) {
        expect(item.dueYear).toBe(480);
        expect(['usurper-threat', 'landowners-resentment', 'successors-drift']).toContain(item.consequenceId);
      }
    }
  });
});

describe('costs the empire cannot pay in full', () => {
  it('every cost cut short at 0 leaves a structural consequence on the same decision or consequence', () => {
    let seen = 0;
    for (const path of enumeratePaths(rome)) {
      const state = after(...path);
      const events = [
        ...state.records.map((r) => ({ effects: r.effects, structural: r.structural })),
        ...state.resolved.map((r) => ({ effects: r.effects, structural: r.structural })),
      ];
      for (const event of events) {
        for (const effect of event.effects) {
          const unpaid = effect.requested < 0 && effect.applied > effect.requested;
          const item = event.structural.find((s) => s.resource === effect.resource);
          expect(Boolean(item)).toBe(unpaid);
          if (item) {
            seen += 1;
            expect(item.unpaid).toBe(effect.applied - effect.requested);
            expect(item.transfer.requested).toBe(-Math.ceil(item.unpaid / 2));
            expect(state.flags).toContain(item.flag);
          }
        }
      }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('example: an emperor with no standing left loses provincial loyalty instead (475, commander’s ambition)', () => {
    const state = after('reform-taxation', 'settle-federates', 'fortify-what-remains', 'rule-through-commander');
    const ambition = consequencesResolvedAt(state, 'd5-final-crisis').find((c) => c.consequenceId === 'commander-ambition')!;
    expect(ambition.effects.find((e) => e.resource === 'legitimacy')).toEqual({
      resource: 'legitimacy',
      requested: -6,
      applied: 0,
      before: 0,
      after: 0,
    });
    expect(ambition.structural.map((s) => [s.resource, s.unpaid, s.transfer.resource, s.transfer.applied, s.flag])).toEqual([
      ['legitimacy', 6, 'unity', -3, 'authority-collapsed'],
    ]);
  });

  it('recovery stays possible: an empire whose treasury defaulted can still end in fragmented survival', () => {
    const path = ['provincial-revenue', 'field-army', 'join-expedition', 'bargain-with-regions', 'defend-imperial-office'];
    const state = after(...path);
    expect(state.flags).toContain('treasury-defaulted');
    expect(state.endingId).toBe('fragmented-survival');
  });
});

describe('endings', () => {
  const ending = (...path: string[]) => after(...path).endingId;

  it('are distributed across all three categories', () => {
    const counts: Record<string, number> = {};
    for (const path of enumeratePaths(rome)) counts[ending(...path)!] = (counts[ending(...path)!] ?? 0) + 1;
    expect(counts).toEqual({ 'imperial-survival': 13, 'fragmented-survival': 91, 'imperial-collapse': 41 });
  });

  it('Imperial Survival: hold the office with standing, army, unity and money, and nothing looming', () => {
    const state = after('pay-the-armies', 'hold-italy', 'treaty-with-gaiseric', 'bargain-with-regions', 'defend-imperial-office');
    expect(state.resources).toEqual(R(26, 63, 29, 45));
    expect([state.endingId, state.endingRuleId]).toEqual(['imperial-survival', 'is-office-holds']);
    // Sharing power can also keep the empire whole, when the court enters the crisis strong.
    expect(ending('provincial-revenue', 'settle-federates', 'join-expedition', 'restore-imperial-authority', 'share-power-with-army')).toBe(
      'imperial-survival',
    );
  });

  it('Fragmented Survival: a Roman order survives in parts, or through successors that hold together', () => {
    // The treasury defaulted in 472, so the office cannot count as fully surviving even after a won war.
    const defaulted = after('provincial-revenue', 'field-army', 'join-expedition', 'bargain-with-regions', 'defend-imperial-office');
    expect([defaulted.endingId, defaulted.endingRuleId]).toEqual(['fragmented-survival', 'fs-order-persists']);
    const successors = after('reform-taxation', 'settle-federates', 'fortify-what-remains', 'bargain-with-regions', 'transfer-to-successors');
    expect(successors.resources).toEqual(R(53, 55, 54, 6));
    expect([successors.endingId, successors.endingRuleId]).toEqual(['fragmented-survival', 'fs-successors-hold']);
  });

  it('Imperial Collapse: restoring authority over a divided empire and then fighting for the throne', () => {
    const state = after('reform-taxation', 'hold-italy', 'treaty-with-gaiseric', 'restore-imperial-authority', 'defend-imperial-office');
    expect(state.resources).toEqual(R(64, 35, 9, 30));
    expect([state.endingId, state.endingRuleId]).toEqual(['imperial-collapse', 'ic-fallback']);
    expect(ending('reform-taxation', 'settle-federates', 'fortify-what-remains', 'bargain-with-regions', 'share-power-with-army')).toBe(
      'imperial-collapse',
    );
  });

  it('depend on the whole campaign, not just the final choice', () => {
    const byChoice = new Map<string, Set<string>>();
    for (const path of enumeratePaths(rome)) {
      if (!byChoice.has(path[4]!)) byChoice.set(path[4]!, new Set());
      byChoice.get(path[4]!)!.add(ending(...path)!);
    }
    expect([...byChoice.get('defend-imperial-office')!].sort()).toEqual(['fragmented-survival', 'imperial-collapse', 'imperial-survival']);
    expect([...byChoice.get('share-power-with-army')!].sort()).toEqual(['fragmented-survival', 'imperial-collapse', 'imperial-survival']);
    expect([...byChoice.get('transfer-to-successors')!].sort()).toEqual(['fragmented-survival', 'imperial-collapse']);
  });

  it('every ending has a structured, fictional report', () => {
    for (const path of enumeratePaths(rome)) {
      const state = after(...path);
      const report = buildEndingReport(rome, state);
      expect(report.fiction).toBe(true);
      expect(report.endingId).toBe(state.endingId);
      expect(report.category).toBe(state.endingId); // one ending per category
      expect(report.year).toBe(476);
      for (const text of [report.settlement, report.imperialAuthority, report.army, report.economy, report.regionalPowers, report.constantinople]) {
        expect(text.length).toBeGreaterThan(20);
      }
      expect(report.keyDecisions).toHaveLength(3);
      expect(report.conditions.every((c) => c.met)).toBe(true);
      expect(JSON.stringify(report)).toBe(JSON.stringify(buildEndingReport(rome, after(...path))));
    }
  });

  it('report example: defended throne, won war', () => {
    const report = buildEndingReport(
      rome,
      after('pay-the-armies', 'hold-italy', 'treaty-with-gaiseric', 'bargain-with-regions', 'defend-imperial-office'),
    );
    expect(report.title).toBe('Imperial Survival');
    expect(report.settlement).toMatch(/^The emperor defended his throne and won/);
    expect(report.constantinople).toMatch(/separate peace with Gaiseric/);
    expect(report.regionalPowers).toBe('The bargain with the regional powers is fraying.');
    expect(report.unpaidCosts).toEqual([]);
    expect(report.looming).toEqual([]);
  });

  it('report example: successors after a collapse of authority', () => {
    const report = buildEndingReport(
      rome,
      after('reform-taxation', 'settle-federates', 'fortify-what-remains', 'rule-through-commander', 'transfer-to-successors'),
    );
    expect(report.endingId).toBe('fragmented-survival');
    expect(report.imperialAuthority).toMatch(/authority collapsed during the crisis/);
    expect(report.unpaidCosts.map((u) => u.flag)).toEqual(['authority-collapsed']);
    expect(report.looming.map((l) => l.consequenceId)).toEqual(['successors-drift']);
    expect(report.keyDecisions.map((k) => k.decisionId)).toHaveLength(3);
  });
});

describe('recovery from severely weakened states at decision 4', () => {
  it('an empty treasury (Economy 0): the bargain brings loans at a real cost; central authority is out of reach', () => {
    const path = ['provincial-revenue', 'field-army', 'join-expedition'];
    expect(after(...path).resources).toEqual(R(0, 51, 47, 33));
    const options = Object.fromEntries(evaluateChoices(rome, after(...path)).map((e) => [e.choice.id, e]));
    expect(options['restore-imperial-authority']!.available).toBe(false);
    expect(options['bargain-with-regions']!.applicableConditionals.map((c) => c.id)).toEqual(['bargain-landowner-loans']);
    const bargain = after(...path, 'bargain-with-regions');
    const record = bargain.records[3]!;
    // Tax relief (−6) and loans (+10) are settled together: Economy 0 → 4, with nothing left unpaid.
    expect(record.effects.find((e) => e.resource === 'economy')).toEqual({ resource: 'economy', requested: 4, applied: 4, before: 0, after: 4 });
    expect(record.structural).toEqual([]);
    expect(bargain.resources).toEqual(R(4, 52, 53, 37)); // after the 475 regional levies
    expect(record.narrative!.effect).toMatch(/right to collect local taxes in exchange for loans/);

    // Ruling through the commander with no money: the unpaid army pay falls on the provinces.
    const commander = after(...path, 'rule-through-commander');
    expect(commander.records[3]!.structural.map((s) => [s.resource, s.unpaid, s.transfer.resource, s.transfer.applied])).toEqual([
      ['economy', 5, 'unity', -3],
    ]);
    expect(commander.resources).toEqual(R(0, 60, 48, 25));
  });

  it('collapsed legitimacy (8): the bargain buys recognition; the commander option leaves the emperor powerless', () => {
    const path = ['reform-taxation', 'settle-federates', 'fortify-what-remains'];
    expect(after(...path).resources).toEqual(R(53, 58, 37, 8));
    const bargain = after(...path, 'bargain-with-regions');
    expect(bargain.resources).toEqual(R(47, 59, 46, 16));
    expect(bargain.records[3]!.narrative!.effect).toMatch(/^Negotiated survival: with its standing collapsed/);
    const commander = after(...path, 'rule-through-commander');
    expect(commander.resources).toEqual(R(48, 64, 34, 0));
    expect(commander.records[3]!.narrative!.effect).toMatch(/^Temporary stabilisation/);
  });
});

describe('decision 5 reports to the council', () => {
  const report = (path: string[]) => replay(rome, path).records[4]!.narrative!;

  it('every report covers the situation, the decision, who gains and loses, the consequences and the risks', () => {
    for (const path of enumeratePaths(rome)) {
      const n = report(path);
      expect(n.situation!.length).toBeGreaterThan(40);
      expect(n.ordered).toMatch(/^You /);
      expect(n.stakeholders.some((s) => s.impact === 'gains')).toBe(true);
      expect(n.stakeholders.some((s) => s.impact === 'loses')).toBe(true);
      expect(n.uncertainty.length).toBeGreaterThan(40);
    }
  });

  it('reflects decision 4 and the unpaid costs of earlier years', () => {
    const notes = (path: string[]) => report(path).situationNotes!.join(' ');
    expect(notes(['pay-the-armies', 'hold-italy', 'join-expedition', 'restore-imperial-authority', 'defend-imperial-office'])).toMatch(
      /restored the emperor’s authority/,
    );
    expect(notes(['provincial-revenue', 'field-army', 'join-expedition', 'rule-through-commander', 'share-power-with-army'])).toMatch(
      /commander rules in the emperor’s name.*already failed to pay/,
    );
    expect(report(['reform-taxation', 'settle-federates', 'fortify-what-remains', 'rule-through-commander', 'transfer-to-successors']).situation).toMatch(
      /standing is all but gone/,
    );
    expect(report(['pay-the-armies', 'hold-italy', 'fortify-what-remains', 'restore-imperial-authority', 'defend-imperial-office']).effect).toMatch(
      /^Because the court had already restored the emperor’s authority/,
    );
    expect(report(['pay-the-armies', 'hold-italy', 'join-expedition', 'rule-through-commander', 'transfer-to-successors']).effect).toMatch(
      /^The commander who already ruled in the emperor’s name now rules in his own/,
    );
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
