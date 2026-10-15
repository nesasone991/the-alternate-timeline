import type { MapCue } from '../../types/map';
import type {
  AlternateScenario,
  AppliedConditional,
  AppliedEffect,
  ResolvedNarrative,
  SimulationState,
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
      /** Empty when the consequence lapsed: nothing happened, so nothing to show. */
      readonly mapCues: readonly MapCue[];
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
        mapCues: item.triggered ? (definition?.mapCues ?? []) : [],
      });
    }
    state = result.state;
  }
  return { state, events };
}
