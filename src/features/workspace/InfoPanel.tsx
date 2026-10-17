import type { ReactNode } from 'react';
import { FictionBadge, SourcedHistoryBadge } from '../../components/ui/Badges';
import type { EraNotation } from '../../lib/dates';
import type { HistoricalEvent, Source } from '../../types/history';
import {
  RESOURCE_KEYS,
  RESOURCE_LABELS,
  type AlternateScenario,
  type SimulationState,
  type WorkspaceMode,
} from '../../types/simulation';
import { EventEntry } from '../history/EventEntry';
import { consequencesResolvedAt, decisionNumber, getNode } from '../simulation/engine';
import { AppliedEffectList, signed } from '../simulation/EffectList';

type InfoPanelProps = {
  mode: WorkspaceMode;
  focusedEvent: HistoricalEvent | undefined;
  sameYearEvents: readonly HistoricalEvent[];
  onSelectEvent: (event: HistoricalEvent) => void;
  sources: readonly Source[];
  era: EraNotation;
  continuityNote?: string;
  /** Heading for the historical section, e.g. "What really happened by 458 AD". */
  historyTitle?: string;
  /** Present in Alternate History mode: the live simulation to report on. */
  simulation?: { readonly scenario: AlternateScenario; readonly state: SimulationState };
};

/** Side panel with the four information areas the simulation will fill. */
export function InfoPanel({
  mode,
  focusedEvent,
  sameYearEvents,
  onSelectEvent,
  sources,
  era,
  continuityNote,
  historyTitle = 'Historical events',
  simulation,
}: InfoPanelProps) {
  const others = sameYearEvents.filter((event) => event.id !== focusedEvent?.id);

  return (
    <div className="flex flex-col gap-px self-start border border-rule/50 bg-rule/30">
      <Section title={historyTitle} badge={<SourcedHistoryBadge />}>
        <div aria-live="polite">
          {focusedEvent ? (
            <EventEntry event={focusedEvent} sources={sources} era={era} headingLevel="h4" />
          ) : (
            <p className="text-parchment-muted">
              No recorded event yet at this point. Press play or move the year slider.
            </p>
          )}
        </div>
        {others.length > 0 ? (
          <div className="mt-4 border-t border-rule-soft pt-3">
            <p className="font-sans text-xs font-semibold text-parchment-muted">Also in this year</p>
            <ul className="mt-1">
              {others.map((event) => (
                <li key={event.id}>
                  <button type="button" className="text-link min-h-11 cursor-pointer text-left" onClick={() => onSelectEvent(event)}>
                    {event.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {continuityNote && focusedEvent?.role === 'anchor' ? (
          <p className="mt-4 border-t border-rule-soft pt-3 text-[0.9375rem] text-parchment-muted">{continuityNote}</p>
        ) : null}
      </Section>

      {simulation ? (
        <SimulationSections scenario={simulation.scenario} state={simulation.state} />
      ) : (
        <>
          <Section title="Decisions">
            <NotBuilt>
              {mode === 'real'
                ? 'Decisions are made in Alternate History mode.'
                : 'Comparison is not built yet. Make decisions in Alternate History mode.'}
            </NotBuilt>
          </Section>
          <Section title="Consequences">
            <NotBuilt>Consequences of each decision, and the rules that produced them, appear in Alternate History mode.</NotBuilt>
          </Section>
          <Section title="Statistics">
            <p className="text-[0.9375rem] text-parchment-muted">
              Four gameplay measures, from 0 to 100. They are abstractions for play, not historical measurements, and
              apply only to alternate timelines.
            </p>
            <ul className="mt-3 flex flex-wrap gap-2 font-sans text-sm">
              {RESOURCE_KEYS.map((key) => (
                <li key={key} className="badge badge-unavailable">
                  {RESOURCE_LABELS[key]}
                </li>
              ))}
            </ul>
          </Section>
        </>
      )}
    </div>
  );
}

function Section({ title, badge, children }: { title: string; badge?: ReactNode; children: ReactNode }) {
  return (
    <section className="bg-night p-4 sm:p-5" aria-label={title}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-sans text-sm font-semibold text-parchment-muted">{title}</h3>
        {badge}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function NotBuilt({ children }: { children: ReactNode }) {
  return <p className="border-l-2 border-dashed border-rule pl-3 text-[0.9375rem] text-parchment-muted">{children}</p>;
}

function SimulationSections({ scenario, state }: { scenario: AlternateScenario; state: SimulationState }) {
  const last = state.records[state.records.length - 1];
  const arrived = consequencesResolvedAt(state, state.currentEventId);
  return (
    <>
      <Section title="Decisions" badge={<FictionBadge />}>
        {state.records.length === 0 ? (
          <p className="text-[0.9375rem] text-parchment-muted">No decision confirmed yet.</p>
        ) : (
          <ol className="space-y-2">
            {state.records.map((record) => {
              const node = getNode(scenario, record.decisionId);
              const choice = node?.kind === 'decision' ? node.choices.find((item) => item.id === record.choiceId) : undefined;
              return (
                <li key={record.decisionId} className="text-[0.9375rem]">
                  <span className="block font-sans text-xs text-parchment-muted">
                    Decision {decisionNumber(scenario, record.decisionId)}
                    {node ? `: ${node.title}` : ''}
                  </span>
                  {choice?.label ?? record.choiceId}
                </li>
              );
            })}
          </ol>
        )}
      </Section>

      <Section title="Consequences">
        {last ? (
          <>
            <p className="font-sans text-xs text-parchment-muted">Your last decision, immediately</p>
            <div className="mt-1">
              <AppliedEffectList effects={last.effects} />
            </div>
            {arrived.length > 0 ? (
              <>
                <p className="mt-3 font-sans text-xs text-parchment-muted">Arrived since then</p>
                <ul className="mt-1 space-y-1 text-[0.9375rem]">
                  {arrived.map((item) => (
                    <li key={item.consequenceId} className="border-l-2 border-gold/60 pl-3">
                      {item.explanation}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            <p className="mt-3 font-sans text-xs text-parchment-muted">
              {state.pending.length === 0
                ? 'No consequences still to come.'
                : `${state.pending.length} consequence${state.pending.length === 1 ? '' : 's'} still to come.`}
            </p>
          </>
        ) : (
          <p className="text-[0.9375rem] text-parchment-muted">Consequences appear here after you confirm a decision.</p>
        )}
      </Section>

      <Section title="Statistics">
        <p className="text-[0.9375rem] text-parchment-muted">
          Gameplay measures from 0 to 100, not historical measurements.
        </p>
        <ul className="mt-3 space-y-3 font-sans text-sm" aria-label="Resources">
          {RESOURCE_KEYS.map((key) => {
            const value = state.resources[key];
            const change = value - scenario.initialResources[key];
            return (
              <li key={key}>
                <div className="flex items-baseline justify-between gap-3">
                  <span>{RESOURCE_LABELS[key]}</span>
                  <span className="tabular-nums" data-testid={`resource-${key}`}>
                    <span className="font-semibold text-parchment">{value}</span>
                    <span className="text-parchment-muted"> / 100</span>
                    {change !== 0 ? (
                      <span className={change < 0 ? 'text-burgundy-bright' : 'text-gold'}> ({signed(change)} since start)</span>
                    ) : null}
                  </span>
                </div>
                <div aria-hidden="true" className="mt-1 h-1.5 w-full bg-ink">
                  <div className="h-full bg-gold/80 transition-[width] duration-300" style={{ width: `${value}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </Section>
    </>
  );
}
