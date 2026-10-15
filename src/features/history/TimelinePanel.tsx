import { useId } from 'react';
import { Icon } from '../../components/ui/Icon';
import { formatYear, type EraNotation } from '../../lib/dates';
import { PLAYBACK_SPEEDS, type PlaybackSpeed } from '../../types/creator';
import type { Timeline } from '../../types/history';
import type { PlaybackAction, PlaybackState } from './timelinePlayback';

type TimelinePanelProps = {
  timeline: Timeline;
  state: PlaybackState;
  dispatch: (action: PlaybackAction) => void;
  era: EraNotation;
  /** When set, the controls are disabled and this explains why. */
  disabledReason?: string;
};

/** Year scrubber, event ticks and playback controls. All controls are native and keyboard operable. */
export function TimelinePanel({ timeline, state, dispatch, era, disabledReason }: TimelinePanelProps) {
  const sliderId = useId();
  const speedName = useId();
  const disabled = disabledReason !== undefined;
  const span = timeline.endYear - timeline.startYear;
  const position = (year: number) => ((year - timeline.startYear) / span) * 100;
  const atFirst = state.eventIndex <= 0;
  const atLast = state.eventIndex >= timeline.events.length - 1;

  return (
    <section aria-labelledby={`${sliderId}-title`} className="border border-rule/50 bg-night p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={`${sliderId}-title`} className="text-lg text-parchment">
          Timeline
        </h2>
        <p className="font-sans text-sm text-parchment-muted">
          {formatYear(timeline.startYear, era)} to {formatYear(timeline.endYear, era)}
        </p>
      </div>

      {disabledReason ? (
        <p role="note" className="mt-2 font-sans text-sm text-burgundy-bright">
          {disabledReason}
        </p>
      ) : null}

      <div className="mt-3">
        <label htmlFor={sliderId} className="sr-only">
          Year
        </label>
        <input
          id={sliderId}
          type="range"
          className="year-range"
          min={timeline.startYear}
          max={timeline.endYear}
          step={1}
          value={state.year}
          disabled={disabled}
          aria-valuetext={formatYear(state.year, era)}
          onChange={(event) => dispatch({ type: 'setYear', year: Number(event.target.value) })}
        />
        {/* Event ticks: a visual scale only; adjacent years are too close to be separate touch targets. */}
        <div aria-hidden="true" className="relative mx-2.5 h-4">
          {timeline.events.map((event, index) => (
            <span
              key={event.id}
              className={`absolute top-0 block w-[3px] -translate-x-1/2 transition-colors ${
                index === state.eventIndex ? 'h-4 bg-gold' : event.date.year <= state.year ? 'h-3 bg-parchment/80' : 'h-3 bg-rule'
              }`}
              style={{ left: `${position(event.date.year)}%` }}
            />
          ))}
        </div>
        <ol className="mt-3 flex flex-wrap gap-1.5" aria-label="Jump to an event">
          {timeline.events.map((event, index) => {
            const isFocused = index === state.eventIndex;
            return (
              <li key={event.id}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => dispatch({ type: 'goToEvent', index })}
                  aria-label={`${formatYear(event.date.year, era)}: ${event.title}`}
                  aria-current={isFocused ? 'step' : undefined}
                  title={event.title}
                  className={`inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center border px-2 font-serif text-[0.9375rem] transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                    isFocused
                      ? 'border-gold bg-gold/15 text-parchment'
                      : 'border-rule-soft text-parchment-muted hover:border-rule hover:text-parchment'
                  }`}
                >
                  {event.date.year}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="icon-btn"
          disabled={disabled || atFirst}
          onClick={() => dispatch({ type: 'previousEvent' })}
          aria-label="Previous event"
        >
          <Icon name="previous" />
        </button>
        <button
          type="button"
          className="icon-btn"
          disabled={disabled}
          onClick={() => dispatch({ type: state.playing ? 'pause' : 'play' })}
          aria-label={state.playing ? 'Pause' : state.year >= timeline.endYear ? 'Replay from the start' : 'Play'}
        >
          <Icon name={state.playing ? 'pause' : 'play'} />
        </button>
        <button
          type="button"
          className="icon-btn"
          disabled={disabled || atLast}
          onClick={() => dispatch({ type: 'nextEvent' })}
          aria-label="Next event"
        >
          <Icon name="next" />
        </button>
        <button
          type="button"
          className="icon-btn"
          disabled={disabled}
          onClick={() => dispatch({ type: 'reset' })}
          aria-label="Back to the start"
        >
          <Icon name="restart" />
        </button>

        <div className="ml-auto flex items-center gap-1" role="radiogroup" aria-labelledby={`${speedName}-label`}>
          <span id={`${speedName}-label`} className="control-label mr-2">
            Speed
          </span>
          {PLAYBACK_SPEEDS.map((speed: PlaybackSpeed) => (
            <label
              key={speed}
              className={`inline-flex h-11 min-w-11 cursor-pointer items-center justify-center border px-2 font-sans text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold-bright ${
                state.speed === speed ? 'border-gold text-parchment' : 'border-rule-soft text-parchment-muted'
              } ${disabled ? 'cursor-not-allowed opacity-45' : ''}`}
            >
              <input
                type="radio"
                name={speedName}
                value={speed}
                checked={state.speed === speed}
                disabled={disabled}
                onChange={() => dispatch({ type: 'setSpeed', speed })}
                className="sr-only"
              />
              {speed}×
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}
