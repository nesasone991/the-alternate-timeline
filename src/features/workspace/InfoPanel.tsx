import type { ReactNode } from 'react';
import { SourcedHistoryBadge } from '../../components/ui/Badges';
import type { EraNotation } from '../../lib/dates';
import type { HistoricalEvent, Source } from '../../types/history';
import { RESOURCE_KEYS, RESOURCE_LABELS, type WorkspaceMode } from '../../types/simulation';
import { EventEntry } from '../history/EventEntry';

type InfoPanelProps = {
  mode: WorkspaceMode;
  focusedEvent: HistoricalEvent | undefined;
  sameYearEvents: readonly HistoricalEvent[];
  onSelectEvent: (event: HistoricalEvent) => void;
  sources: readonly Source[];
  era: EraNotation;
  continuityNote?: string;
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
}: InfoPanelProps) {
  const others = sameYearEvents.filter((event) => event.id !== focusedEvent?.id);

  return (
    <div className="flex flex-col gap-px border border-rule/50 bg-rule/30">
      <Section title="Historical events" badge={<SourcedHistoryBadge />}>
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

      <Section title="Decisions">
        <NotBuilt>
          {mode === 'real'
            ? 'Decisions belong to Alternate History mode. The decision engine is not built yet (phase 2).'
            : 'The decision engine is not built yet (phase 2). Five turning points from 455 to 476 will appear here.'}
        </NotBuilt>
      </Section>

      <Section title="Consequences">
        <NotBuilt>
          Consequences of each decision, and the rules that produced them, will be listed here once the engine is
          built.
        </NotBuilt>
      </Section>

      <Section title="Statistics">
        <p className="text-[0.9375rem] text-parchment-muted">
          Four gameplay measures, from 0 to 100. They are abstractions for play, not historical measurements, and
          apply only to alternate timelines.
        </p>
        <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 font-sans text-sm">
          {RESOURCE_KEYS.map((key) => (
            <div key={key} className="contents">
              <dt>{RESOURCE_LABELS[key]}</dt>
              <dd className="text-parchment-muted">Not tracked yet</dd>
            </div>
          ))}
        </dl>
      </Section>
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
