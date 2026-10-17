import type { MapCue } from '../../types/map';
import type {
  AlternateScenario,
  AppliedConditional,
  AppliedEffect,
  EndingCategory,
  ResolvedNarrative,
  ResourceKey,
  Resources,
  SimulationState,
  StructuralConsequence,
} from '../../types/simulation';
import { applyChoice, createInitialState, findConsequence, getNode } from './engine';

/**
 * The ordered story of one alternate timeline, as structured data.
 *
 * This is the contract for the future Historical Animation Studio and map: a
 * renderer replays these events in `sequence` order, using `year` for the clock
 * and `mapCues` for what to show. The list is produced by replaying the choices
 * through the engine, so the same choices always give the same events — there is
 * no randomness anywhere in it. Every event is fiction (`fiction: true`).
 */
export type StoryEvent =
  | {
      readonly kind: 'decision';
      readonly sequence: number;
      readonly fiction: true;
      readonly year: number;
      readonly yearApproximate: boolean;
      readonly decisionId: string;
      readonly decisionTitle: string;
      readonly choiceId: string;
      readonly choiceLabel: string;
      readonly outcome: string;
      readonly narrative?: ResolvedNarrative;
      readonly effects: readonly AppliedEffect[];
      /** Costs that could not be paid in full, and what made up for them. */
      readonly structural: readonly StructuralConsequence[];
      readonly conditional: readonly AppliedConditional[];
      readonly flagsSet: readonly string[];
      readonly mapCues: readonly MapCue[];
    }
  | {
      readonly kind: 'consequence';
      readonly sequence: number;
      readonly fiction: true;
      readonly year: number;
      readonly consequenceId: string;
      readonly sourceDecisionId: string;
      readonly sourceChoiceId: string;
      readonly triggered: boolean;
      readonly explanation: string;
      readonly effects: readonly AppliedEffect[];
      readonly structural: readonly StructuralConsequence[];
      /** Empty when the consequence lapsed: nothing happened, so nothing to show. */
      readonly mapCues: readonly MapCue[];
    }
  | {
      /** The last event of a finished campaign: which ending it reached, after everything due had resolved. */
      readonly kind: 'ending';
      readonly sequence: number;
      readonly fiction: true;
      readonly year: number;
      readonly endingId: string;
      readonly category: EndingCategory;
      readonly ruleId: string;
    };

export function replayWithEvents(
  scenario: AlternateScenario,
  choiceIds: readonly string[],
): { state: SimulationState; events: StoryEvent[] } {
  let state = createInitialState(scenario);
  const events: StoryEvent[] = [];
  for (const choiceId of choiceIds) {
    const resolvedBefore = state.resolved.length;
    const result = applyChoice(scenario, state, choiceId);
    if (!result.ok) throw new Error(`Replay failed at "${choiceId}": ${result.message}`);
    const { record } = result;
    const decision = getNode(scenario, record.decisionId);
    const choice = decision?.kind === 'decision' ? decision.choices.find((c) => c.id === record.choiceId) : undefined;
    events.push({
      kind: 'decision',
      sequence: events.length + 1,
      fiction: true,
      year: record.year,
      yearApproximate: decision?.yearApproximate ?? false,
      decisionId: record.decisionId,
      decisionTitle: decision?.title ?? record.decisionId,
      choiceId: record.choiceId,
      choiceLabel: choice?.label ?? record.choiceId,
      outcome: choice?.outcome ?? '',
      ...(record.narrative ? { narrative: record.narrative } : {}),
      effects: record.effects,
      structural: record.structural,
      conditional: record.conditional,
      flagsSet: record.flagsSet,
      mapCues: choice?.mapCues ?? [],
    });
    // Consequences that came due on arriving at the next node, in resolution order.
    for (const item of result.state.resolved.slice(resolvedBefore)) {
      const definition = findConsequence(scenario, item.consequenceId);
      events.push({
        kind: 'consequence',
        sequence: events.length + 1,
        fiction: true,
        year: item.resolvedYear,
        consequenceId: item.consequenceId,
        sourceDecisionId: item.sourceDecisionId,
        sourceChoiceId: item.sourceChoiceId,
        triggered: item.triggered,
        explanation: item.explanation,
        effects: item.effects,
        structural: item.structural,
        mapCues: item.triggered ? (definition?.mapCues ?? []) : [],
      });
    }
    state = result.state;
  }
  const ending = scenario.endings?.find((item) => item.id === state.endingId);
  if (ending && state.endingRuleId) {
    events.push({
      kind: 'ending',
      sequence: events.length + 1,
      fiction: true,
      year: state.year,
      endingId: ending.id,
      category: ending.category,
      ruleId: state.endingRuleId,
    });
  }
  return { state, events };
}

/** The four resources at one point of the story, as the engine recorded them. */
export type ResourcePoint = {
  /** 0 for the starting state; otherwise the `sequence` of the event after which this holds. */
  readonly sequence: number;
  readonly kind: 'start' | 'decision' | 'consequence';
  readonly year: number;
  readonly label: string;
  /** For consequences: false when it lapsed (no change). */
  readonly triggered?: boolean;
  readonly resources: Resources;
};

/**
 * How the four resources moved through the campaign: the starting values, then
 * the state after every decision and every consequence that came due (lapsed
 * ones included, unchanged), in story order.
 *
 * Nothing is recalculated: each point copies the `after` values the engine
 * recorded on the event's applied effects and structural transfers. As a
 * guard, the last point must equal the replayed final state exactly.
 */
export function resourceTimeline(scenario: AlternateScenario, choiceIds: readonly string[]): ResourcePoint[] {
  const { state, events } = replayWithEvents(scenario, choiceIds);
  const start = createInitialState(scenario);
  const points: ResourcePoint[] = [
    { sequence: 0, kind: 'start', year: getNode(scenario, start.currentEventId)?.year ?? start.year, label: 'Start', resources: start.resources },
  ];
  let current: Record<ResourceKey, number> = { ...start.resources };
  for (const event of events) {
    if (event.kind === 'ending') continue;
    const next = { ...current };
    for (const effect of event.effects) next[effect.resource] = effect.after;
    for (const item of event.structural) next[item.transfer.resource] = item.transfer.after;
    current = next;
    points.push({
      sequence: event.sequence,
      kind: event.kind,
      year: event.year,
      label: event.kind === 'decision' ? `${event.decisionTitle}: ${event.choiceLabel}` : event.explanation,
      ...(event.kind === 'consequence' ? { triggered: event.triggered } : {}),
      resources: next,
    });
  }
  for (const key of Object.keys(state.resources) as ResourceKey[]) {
    if (current[key] !== state.resources[key]) {
      throw new Error(`Resource history disagrees with the replayed state for ${key}.`);
    }
  }
  return points;
}
