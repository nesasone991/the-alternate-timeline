import { useEffect, useRef, useState } from 'react';
import { formatYear, type EraNotation } from '../../lib/dates';
import { RESOURCE_KEYS, RESOURCE_LABELS, type AlternateScenario } from '../../types/simulation';
import { AppliedEffectList, StructuralList, signed } from '../simulation/EffectList';
import { flagLabel } from '../simulation/engine';
import type { ResourcePoint, StoryEvent } from '../simulation/storyEvents';

/**
 * "Replay your decisions": steps through the recorded story one event at a
 * time. It only reads the replayed events; nothing here writes to the saved
 * campaign or changes any state outside this component.
 */
export function ReplayPanel({
  scenario,
  events,
  points,
  endingTitle,
  era,
  onStart,
}: {
  scenario: AlternateScenario;
  events: readonly StoryEvent[];
  points: readonly ResourcePoint[];
  endingTitle: string;
  era: EraNotation;
  /** Called when the reader opens the replay (for anonymous usage counts). */
  onStart?: () => void;
}) {
  const [index, setIndex] = useState<number | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (index !== null) headingRef.current?.focus();
    else if (wasOpen.current) startRef.current?.focus();
    wasOpen.current = index !== null;
  }, [index]);

  if (index === null) {
    return (
      <div>
        <p className="max-w-[42rem]">
          Step through your campaign one event at a time: each decision, each consequence as it came due, and the ending.
          Replaying only reads your history; your saved campaign stays exactly as it is.
        </p>
        <button ref={startRef} type="button" className="btn btn-secondary mt-4" onClick={() => {
            onStart?.();
            setIndex(0);
          }}>
          Replay your decisions
        </button>
      </div>
    );
  }

  const event = events[index]!;
  const point = event.kind === 'ending' ? points[points.length - 1]! : points.find((item) => item.sequence === event.sequence)!;
  const previous = points[Math.max(0, points.indexOf(point) - 1)]!;
  const label = (flag: string) => flagLabel(scenario, flag);

  return (
    <div className="border border-rule/60 bg-night p-4 sm:p-6" data-testid="replay">
      <p className="font-sans text-sm text-parchment-muted" aria-live="polite">
        Step {index + 1} of {events.length}
      </p>
      <h3 ref={headingRef} tabIndex={-1} className="mt-1 text-2xl text-parchment outline-none">
        {event.kind === 'decision'
          ? `c. ${formatYear(event.year, era)}: ${event.decisionTitle}`
          : event.kind === 'consequence'
            ? `c. ${formatYear(event.year, era)}: a consequence ${event.triggered ? 'takes effect' : 'does not happen'}`
            : `c. ${formatYear(event.year, era)}: ${endingTitle}`}
      </h3>

      <div className="mt-3 min-h-40" data-testid="replay-step">
        {event.kind === 'decision' ? (
          <>
            <p className="text-lg text-parchment">You chose: {event.choiceLabel}</p>
            <p className="mt-2 max-w-[42rem]">{event.outcome}</p>
            <div className="mt-3 max-w-md">
              <AppliedEffectList effects={event.effects} />
            </div>
            <StructuralList items={event.structural} flagLabel={label} />
          </>
        ) : event.kind === 'consequence' ? (
          <>
            <p className="max-w-[42rem] text-lg text-parchment">{event.explanation}</p>
            {event.effects.length > 0 ? (
              <div className="mt-3 max-w-md">
                <AppliedEffectList effects={event.effects} />
              </div>
            ) : (
              <p className="mt-2 font-sans text-sm text-parchment-muted">No effect.</p>
            )}
            <StructuralList items={event.structural} flagLabel={label} />
          </>
        ) : (
          <p className="max-w-[42rem] text-lg text-parchment">
            Everything due by {formatYear(event.year, era)} has taken effect. The campaign ends in {endingTitle}.
          </p>
        )}
      </div>

      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-rule-soft pt-3 font-sans text-sm sm:grid-cols-4">
        {RESOURCE_KEYS.map((key) => {
          const change = point.resources[key] - previous.resources[key];
          return (
            <li key={key}>
              <span className="text-parchment-muted">{RESOURCE_LABELS[key]} </span>
              <span className="font-semibold tabular-nums text-parchment">{point.resources[key]}</span>
              {change !== 0 && event.kind !== 'ending' ? <span className="text-parchment-muted"> ({signed(change)})</span> : null}
            </li>
          );
        })}
      </ul>

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" className="btn btn-secondary" onClick={() => setIndex(index - 1)} disabled={index === 0}>
          Previous step
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIndex(index + 1)}
          disabled={index === events.length - 1}
        >
          Next step
        </button>
        <button type="button" className="btn btn-quiet" onClick={() => setIndex(null)}>
          Close the replay
        </button>
      </div>
    </div>
  );
}
