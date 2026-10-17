import { Link } from 'react-router';
import { formatYear, type EraNotation } from '../../lib/dates';
import type { HistoricalEvent } from '../../types/history';
import type { AlternateScenario, SimulationState } from '../../types/simulation';
import { NarrativeReport } from '../simulation/DecisionPanel';
import { AppliedEffectList, StructuralList } from '../simulation/EffectList';
import { flagLabel, getNode } from '../simulation/engine';
import type { EndingReport } from '../simulation/endings';

function yearLabel(year: number, approximate: boolean, era: EraNotation) {
  return `${approximate ? 'c. ' : ''}${formatYear(year, era)}`;
}

/**
 * "The decisions that changed history": every decision in order, with what the
 * engine recorded for it — immediate effects, unpaid costs, the consequences it
 * set in motion (taken effect, lapsed or still ahead) and why it played out as
 * it did. Nothing here is invented: every line comes from the state's records.
 */
export function DecisionReview({
  scenario,
  state,
  report,
  era,
  historicalEvents,
  realHistoryHref,
}: {
  scenario: AlternateScenario;
  state: SimulationState;
  report: EndingReport;
  era: EraNotation;
  historicalEvents: readonly HistoricalEvent[];
  realHistoryHref: (eventId: string) => string;
}) {
  const keyIds = new Set(report.keyDecisions.map((item) => item.decisionId));
  const looming = new Set(report.looming.map((item) => item.consequenceId));
  const label = (flag: string) => flagLabel(scenario, flag);

  return (
    <ol className="relative border-l border-rule pl-6 sm:pl-8" data-testid="decision-review">
      {state.records.map((record, index) => {
        const node = getNode(scenario, record.decisionId);
        if (node?.kind !== 'decision') return null;
        const choice = node.choices.find((item) => item.id === record.choiceId);
        const resolved = state.resolved.filter((item) => item.sourceDecisionId === record.decisionId);
        const ahead = state.pending.filter((item) => item.sourceDecisionId === record.decisionId);
        const context = node.historicalContextIds
          .map((id) => historicalEvents.find((event) => event.id === id))
          .filter((event): event is HistoricalEvent => event !== undefined);
        return (
          <li key={record.decisionId} className="relative pb-10 last:pb-0">
            <span
              aria-hidden="true"
              className="absolute top-2 -left-[calc(1.5rem+5px)] size-[9px] rounded-full border-2 border-ink bg-gold sm:-left-[calc(2rem+5px)]"
            />
            <article aria-labelledby={`decision-${index}`} data-testid={`review-${record.decisionId}`}>
              <p className="font-sans text-sm text-gold">
                {yearLabel(record.year, node.yearApproximate, era)}: decision {index + 1}, {node.title}
              </p>
              <h3 id={`decision-${index}`} className="mt-1 text-[clamp(1.25rem,3vw,1.625rem)] leading-snug text-parchment">
                {choice?.label ?? record.choiceId}
              </h3>
              {keyIds.has(record.decisionId) ? (
                <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-sm text-parchment-muted">
                  <span className="badge badge-preview">Turning point</span>
                  <span>One of the three decisions that shaped this ending most.</span>
                </p>
              ) : null}
              {choice ? <p className="mt-3 max-w-[42rem] text-[1.0625rem]">{choice.outcome}</p> : null}

              <div className="mt-4 grid gap-6 lg:grid-cols-2">
                <div>
                  <h4 className="font-sans text-sm font-semibold text-parchment-muted">Immediately</h4>
                  <div className="mt-1 max-w-md">
                    <AppliedEffectList effects={record.effects} />
                  </div>
                  {record.conditional.length > 0 ? (
                    <ul className="mt-2 space-y-1 font-sans text-sm text-parchment-muted">
                      {record.conditional.map((item) => (
                        <li key={item.id}>{item.explanation}</li>
                      ))}
                    </ul>
                  ) : null}
                  <StructuralList items={record.structural} flagLabel={label} />
                </div>

                <div>
                  <h4 className="font-sans text-sm font-semibold text-parchment-muted">What it set in motion</h4>
                  {resolved.length === 0 && ahead.length === 0 ? (
                    <p className="mt-1 font-sans text-sm text-parchment-muted">No later consequences.</p>
                  ) : (
                    <ul className="mt-1 space-y-3">
                      {resolved.map((item) => (
                        <li
                          key={item.consequenceId}
                          className={`border-l-2 pl-3 ${item.triggered ? 'border-gold/70' : 'border-rule'}`}
                          data-testid="review-consequence"
                        >
                          <span className="block font-sans text-xs text-parchment-muted">
                            {yearLabel(item.resolvedYear, true, era)}: {item.triggered ? 'took effect' : 'did not happen'}
                          </span>
                          <span className="block text-[0.9375rem] text-parchment">{item.explanation}</span>
                          {item.effects.length > 0 ? (
                            <div className="mt-1 max-w-md">
                              <AppliedEffectList effects={item.effects} />
                            </div>
                          ) : null}
                          <StructuralList items={item.structural} flagLabel={label} />
                        </li>
                      ))}
                      {ahead.map((item) => (
                        <li key={item.consequenceId} className="border-l-2 border-dashed border-rule pl-3">
                          <span className="block font-sans text-xs text-parchment-muted">
                            Still ahead, {yearLabel(item.dueYear, true, era)}
                            {looming.has(item.consequenceId) ? ': a threat that would strike as things stand' : ''}
                          </span>
                          <span className="block text-[0.9375rem]">{item.hint}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {record.narrative || context.length > 0 ? (
                <details className="mt-4 border-t border-rule-soft pt-2">
                  <summary className="inline-flex min-h-11 cursor-pointer items-center font-sans text-sm text-gold">
                    The situation and the report to the council
                  </summary>
                  <p className="mt-2 max-w-[42rem] text-[0.9375rem] text-parchment-muted">{node.context}</p>
                  {context.length > 0 ? (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {context.map((event) => (
                        <li key={event.id}>
                          <Link
                            to={realHistoryHref(event.id)}
                            className="inline-flex min-h-11 items-center border border-teal-bright/50 px-3 font-sans text-sm text-teal-bright no-underline hover:border-teal-bright"
                          >
                            Sourced history: {event.date.year}, {event.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {record.narrative ? <NarrativeReport narrative={record.narrative} /> : null}
                </details>
              ) : null}
            </article>
          </li>
        );
      })}
    </ol>
  );
}
