import type { HistoricalEvent, Timeline } from '../../types/history';
import type { PlaybackSpeed } from '../../types/creator';

/**
 * Timeline playback as a pure reducer. The year cursor moves one year per tick;
 * the "focused" event is the latest event at or before the cursor, or the event
 * the user jumped to with previous/next. No animation is involved, so controls
 * never wait for a transition to finish.
 */

export type PlaybackState = {
  readonly year: number;
  /** Index into timeline.events, or -1 when no event has happened yet. */
  readonly eventIndex: number;
  readonly playing: boolean;
  readonly speed: PlaybackSpeed;
};

export type PlaybackAction =
  | { readonly type: 'setYear'; readonly year: number }
  | { readonly type: 'nextEvent' }
  | { readonly type: 'previousEvent' }
  | { readonly type: 'goToEvent'; readonly index: number }
  | { readonly type: 'play' }
  | { readonly type: 'pause' }
  | { readonly type: 'tick' }
  | { readonly type: 'setSpeed'; readonly speed: PlaybackSpeed }
  | { readonly type: 'reset' };

/** Milliseconds per year at 1× speed. */
export const BASE_MS_PER_YEAR = 700;

export function tickInterval(speed: PlaybackSpeed): number {
  return Math.round(BASE_MS_PER_YEAR / speed);
}

export function clampYear(timeline: Timeline, year: number): number {
  if (!Number.isFinite(year)) return timeline.startYear;
  return Math.min(timeline.endYear, Math.max(timeline.startYear, Math.round(year)));
}

/** Latest event index whose year is at or before `year`; -1 if none. */
export function eventIndexAtYear(timeline: Timeline, year: number): number {
  let found = -1;
  timeline.events.forEach((event, index) => {
    if (event.date.year <= year) found = index;
  });
  return found;
}

export function eventsInYear(timeline: Timeline, year: number): HistoricalEvent[] {
  return timeline.events.filter((event) => event.date.year === year);
}

export function initialPlaybackState(timeline: Timeline, startYear?: number): PlaybackState {
  const year = clampYear(timeline, startYear ?? timeline.startYear);
  // Opening on a year with several events starts at the first of them, so none is skipped.
  const first = timeline.events.findIndex((event) => event.date.year === year);
  return { year, eventIndex: first >= 0 ? first : eventIndexAtYear(timeline, year), playing: false, speed: 1 };
}

export function playbackReducer(timeline: Timeline) {
  const lastIndex = timeline.events.length - 1;

  const goTo = (state: PlaybackState, index: number): PlaybackState => {
    const bounded = Math.min(lastIndex, Math.max(0, index));
    const event = timeline.events[bounded];
    if (!event) return state;
    return { ...state, eventIndex: bounded, year: event.date.year, playing: false };
  };

  return (state: PlaybackState, action: PlaybackAction): PlaybackState => {
    switch (action.type) {
      case 'setYear': {
        const year = clampYear(timeline, action.year);
        return { ...state, year, eventIndex: eventIndexAtYear(timeline, year) };
      }
      case 'nextEvent':
        if (state.eventIndex >= lastIndex) return state;
        return goTo(state, state.eventIndex + 1);
      case 'previousEvent':
        if (state.eventIndex <= 0) return state;
        return goTo(state, state.eventIndex - 1);
      case 'goToEvent':
        return goTo(state, action.index);
      case 'play':
        // Playing from the end restarts from the beginning.
        if (state.year >= timeline.endYear) {
          return { ...initialPlaybackState(timeline), speed: state.speed, playing: true };
        }
        return { ...state, playing: true };
      case 'pause':
        return { ...state, playing: false };
      case 'tick': {
        if (!state.playing) return state;
        const year = clampYear(timeline, state.year + 1);
        return {
          ...state,
          year,
          eventIndex: eventIndexAtYear(timeline, year),
          playing: year < timeline.endYear,
        };
      }
      case 'setSpeed':
        return { ...state, speed: action.speed };
      case 'reset':
        return { ...initialPlaybackState(timeline), speed: state.speed };
    }
  };
}
