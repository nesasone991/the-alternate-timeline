import {
  RESOURCE_KEYS,
  type AlternateScenario,
  type EndingCategory,
  type EndingLine,
  type ResourceKey,
  type SimulationState,
} from '../../types/simulation';
import { checkRequirement, classifyEnding, flagLabel, getNode, type EndingCheck } from './engine';

/**
 * The structured ending report: everything a future ending screen, share card
 * or Animation Studio needs to describe how a campaign ended. Data only — no
 * presentation. Every line is authored fiction selected deterministically from
 * the final state; `fiction: true` is always set so no consumer can present it
 * as history.
 */
export type KeyDecision = {
  readonly decisionId: string;
  readonly decisionTitle: string;
  readonly choiceId: string;
  readonly choiceLabel: string;
  readonly year: number;
  /** Net change this decision caused over the whole campaign: immediately, through unpaid costs and through its later consequences. */
  readonly changes: readonly { readonly resource: ResourceKey; readonly change: number }[];
  /** Sum of absolute changes to the resources that decided the ending. */
  readonly weight: number;
};

export type EndingReport = {
  readonly fiction: true;
  readonly endingId: string;
  readonly category: EndingCategory;
  readonly title: string;
  readonly summary: string;
  readonly year: number;
  readonly ruleId: string;
  /** Why the rule that matched leads to this ending. */
  readonly why: string;
  /** The matched rule's conditions as they stood at the end. */
  readonly conditions: readonly EndingCheck[];
  readonly settlement: string;
  readonly imperialAuthority: string;
  readonly army: string;
  readonly economy: string;
  readonly regionalPowers: string;
  readonly constantinople: string;
  /** The three decisions that moved the deciding resources most, in campaign order. */
  readonly keyDecisions: readonly KeyDecision[];
  /** Harmful consequences still pending whose condition already holds. */
  readonly looming: readonly { readonly consequenceId: string; readonly hint: string; readonly dueYear: number }[];
  /** Costs that could not be paid in full at some point in the campaign. */
  readonly unpaidCosts: readonly { readonly flag: string; readonly label: string }[];
};

function pickLine(
  scenario: AlternateScenario,
  state: SimulationState,
  endingId: string,
  lines: readonly EndingLine[],
): string {
  const line = lines.find(
    (item) =>
      (!item.endings || item.endings.includes(endingId)) &&
      (item.when ?? []).every((requirement) => checkRequirement(scenario, state, requirement).met),
  );
  if (!line) throw new Error(`Scenario ${scenario.id}: an ending-report section has no unconditional last line.`);
  return line.text;
}

/** Builds the report for a state that has reached an ending. Throws if it has not. */
export function buildEndingReport(scenario: AlternateScenario, state: SimulationState): EndingReport {
  if (!state.endingId) throw new Error('The campaign has not reached an ending.');
  const classification = classifyEnding(scenario, state);
  const ending = scenario.endings?.find((item) => item.id === state.endingId);
  const narrative = scenario.endingNarrative;
  if (!classification || !ending || !narrative) throw new Error(`Scenario ${scenario.id} has no ending data.`);
  if (classification.endingId !== state.endingId) throw new Error('The stored ending no longer matches the rules.');
  const matched = classification.evaluated[classification.evaluated.length - 1]!;

  // The resources the deciding rule looked at; for the unconditional fallback, all of them.
  const deciding = new Set<ResourceKey>(
    matched.rule.conditions.flatMap((condition) => (condition.resource !== undefined ? [condition.resource] : [])),
  );
  const relevant = deciding.size > 0 ? deciding : new Set<ResourceKey>(RESOURCE_KEYS);

  const decisions: KeyDecision[] = state.records.map((record) => {
    const totals = new Map<ResourceKey, number>();
    const add = (resource: ResourceKey, change: number) => totals.set(resource, (totals.get(resource) ?? 0) + change);
    for (const effect of record.effects) add(effect.resource, effect.applied);
    for (const item of record.structural) add(item.transfer.resource, item.transfer.applied);
    for (const item of state.resolved.filter((resolved) => resolved.sourceDecisionId === record.decisionId)) {
      for (const effect of item.effects) add(effect.resource, effect.applied);
      for (const structural of item.structural) add(structural.transfer.resource, structural.transfer.applied);
    }
    const changes = RESOURCE_KEYS.filter((key) => (totals.get(key) ?? 0) !== 0).map((key) => ({
      resource: key,
      change: totals.get(key) ?? 0,
    }));
    const node = getNode(scenario, record.decisionId);
    const choice = node?.kind === 'decision' ? node.choices.find((item) => item.id === record.choiceId) : undefined;
    return {
      decisionId: record.decisionId,
      decisionTitle: node?.title ?? record.decisionId,
      choiceId: record.choiceId,
      choiceLabel: choice?.label ?? record.choiceId,
      year: record.year,
      changes,
      weight: changes.filter((item) => relevant.has(item.resource)).reduce((sum, item) => sum + Math.abs(item.change), 0),
    };
  });
  const top = decisions
    .map((decision, index) => ({ decision, index }))
    .sort((a, b) => b.decision.weight - a.decision.weight || a.index - b.index)
    .slice(0, 3)
    .sort((a, b) => a.index - b.index)
    .map((item) => item.decision);

  const unpaidFlags = new Set((scenario.shortfallRules ?? []).map((rule) => rule.flag));
  const pick = (lines: readonly EndingLine[]) => pickLine(scenario, state, ending.id, lines);
  return {
    fiction: true,
    endingId: ending.id,
    category: ending.category,
    title: ending.title,
    summary: ending.summary,
    year: state.year,
    ruleId: matched.rule.id,
    why: matched.rule.explanation,
    conditions: matched.checks,
    settlement: pick(narrative.settlement),
    imperialAuthority: pick(narrative.imperialAuthority),
    army: pick(narrative.army),
    economy: pick(narrative.economy),
    regionalPowers: pick(narrative.regionalPowers),
    constantinople: pick(narrative.constantinople),
    keyDecisions: top,
    looming: classification.looming.map((item) => ({ consequenceId: item.consequenceId, hint: item.hint, dueYear: item.dueYear })),
    unpaidCosts: state.flags.filter((flag) => unpaidFlags.has(flag)).map((flag) => ({ flag, label: flagLabel(scenario, flag) })),
  };
}
