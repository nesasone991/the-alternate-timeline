import { CertaintyBadge } from '../../components/ui/Badges';
import { formatHistoricalDate, precisionLabel, type EraNotation } from '../../lib/dates';
import type { HistoricalEvent, Source } from '../../types/history';
import { SourceLinks } from './SourceLinks';

type EventEntryProps = {
  event: HistoricalEvent;
  sources: readonly Source[];
  era: EraNotation;
  headingLevel?: 'h3' | 'h4';
};

/** One sourced historical event: date at its true precision, certainty, summary, caveat and sources. */
export function EventEntry({ event, sources, era, headingLevel = 'h3' }: EventEntryProps) {
  const Heading = headingLevel;
  return (
    <div>
      <p className="font-sans text-sm text-gold">
        <time dateTime={String(event.date.year).padStart(4, '0')}>{formatHistoricalDate(event.date, era)}</time>
        <span className="text-parchment-muted"> ({precisionLabel(event.date.precision).toLowerCase()})</span>
      </p>
      <Heading className="mt-1 text-xl leading-snug text-parchment">{event.title}</Heading>
      <div className="mt-2">
        <CertaintyBadge certainty={event.certainty} />
      </div>
      <p className="mt-3">{event.summary}</p>
      {event.caveat ? (
        <p className="mt-3 border-l-2 border-burgundy-bright/70 pl-3 text-[0.9375rem] text-parchment-muted">
          <span className="font-sans text-xs font-semibold text-burgundy-bright">Historians’ caveat </span>
          {event.caveat}
        </p>
      ) : null}
      <div className="mt-3">
        <SourceLinks sourceIds={event.sourceIds} sources={sources} compact />
      </div>
    </div>
  );
}
