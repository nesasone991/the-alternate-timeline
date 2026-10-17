import { Link } from 'react-router';
import { CertaintyBadge, FictionBadge, SourcedHistoryBadge } from '../../components/ui/Badges';
import { formatHistoricalDate, type EraNotation } from '../../lib/dates';
import type { HistoricalEvent, Source } from '../../types/history';
import { SourceLinks } from '../history/SourceLinks';
import type { EndingReport } from '../simulation/endings';

/**
 * "What really happened": the player's fictional outcome beside the sourced
 * events of the same years. Only events from the actual-history dataset are
 * shown on the history side, with their sources, certainty and caveats — no
 * claim is made here that the dataset does not make.
 */
export function WhatReallyHappened({
  report,
  events,
  sources,
  continuityNote,
  era,
  realHistoryHref,
  lastChoiceLabel,
}: {
  report: EndingReport;
  events: readonly HistoricalEvent[];
  sources: readonly Source[];
  continuityNote?: { readonly text: string; readonly sourceIds: readonly string[] };
  era: EraNotation;
  realHistoryHref: (eventId: string) => string;
  lastChoiceLabel: string;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <section
        aria-labelledby="your-timeline-title"
        className="self-start border border-dashed border-burgundy-bright/60 bg-burgundy/10 p-5"
        data-testid="fiction-side"
      >
        <FictionBadge />
        <h3 id="your-timeline-title" className="mt-3 text-xl text-parchment">
          In your timeline
        </h3>
        <p className="mt-2 font-sans text-sm text-parchment-muted">Your last decision: {lastChoiceLabel}</p>
        <p className="mt-3 text-[1.0625rem]">
          <span className="font-semibold">{report.title}.</span> {report.settlement}
        </p>
        <p className="mt-3 text-[0.9375rem]">{report.constantinople}</p>
        <p className="mt-4 font-sans text-xs text-parchment-muted">
          Invented for this game. The choices, their effects and this outcome did not happen.
        </p>
      </section>

      <section
        aria-labelledby="recorded-history-title"
        className="border border-teal-bright/50 bg-teal/10 p-5"
        data-testid="history-side"
      >
        <SourcedHistoryBadge />
        <h3 id="recorded-history-title" className="mt-3 text-xl text-parchment">
          In recorded history
        </h3>
        <ol className="mt-4 space-y-6">
          {events.map((event) => (
            <li key={event.id} className="border-l-2 border-teal-bright/60 pl-4" data-testid={`real-${event.id}`}>
              <p className="font-sans text-sm text-teal-bright">{formatHistoricalDate(event.date, era)}</p>
              <h4 className="mt-0.5 text-lg leading-snug text-parchment">{event.title}</h4>
              <div className="mt-1">
                <CertaintyBadge certainty={event.certainty} />
              </div>
              <p className="mt-2 text-[0.9375rem]">{event.summary}</p>
              {event.caveat ? (
                <p className="mt-2 font-sans text-sm text-parchment-muted">
                  <span className="font-semibold">Historians’ caveat: </span>
                  {event.caveat}
                </p>
              ) : null}
              <details className="mt-1">
                <summary className="inline-flex min-h-11 cursor-pointer items-center font-sans text-sm text-parchment-muted">
                  Sources
                </summary>
                <SourceLinks sourceIds={event.sourceIds} sources={sources} compact />
              </details>
              <Link to={realHistoryHref(event.id)} className="text-link inline-flex min-h-11 items-center font-sans text-sm">
                Open “{event.title}” in Real History
              </Link>
            </li>
          ))}
        </ol>
        {continuityNote ? (
          <div className="mt-6 border-t border-teal-bright/30 pt-4">
            <p className="text-[0.9375rem]">{continuityNote.text}</p>
            <div className="mt-2">
              <SourceLinks sourceIds={continuityNote.sourceIds} sources={sources} compact />
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
