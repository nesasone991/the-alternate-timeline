import { describe, expect, it } from 'vitest';
import { romeActualTimeline } from '../../src/data/scenarios/rome/history';
import {
  clampYear,
  eventIndexAtYear,
  eventsInYear,
  initialPlaybackState,
  playbackReducer,
  tickInterval,
  type PlaybackAction,
  type PlaybackState,
} from '../../src/features/history/timelinePlayback';
import type { Timeline } from '../../src/types/history';

const timeline: Timeline = {
  id: 'test',
  startYear: 400,
  endYear: 410,
  events: [
    { id: 'a', date: { year: 402, precision: 'year' }, title: 'A', summary: 's', sourceIds: ['x'], certainty: 'well-attested', role: 'context' },
    { id: 'b', date: { year: 405, precision: 'year' }, title: 'B', summary: 's', sourceIds: ['x'], certainty: 'well-attested', role: 'context' },
    { id: 'c', date: { year: 405, precision: 'year' }, title: 'C', summary: 's', sourceIds: ['x'], certainty: 'well-attested', role: 'context' },
    { id: 'd', date: { year: 409, precision: 'year' }, title: 'D', summary: 's', sourceIds: ['x'], certainty: 'well-attested', role: 'context' },
  ],
};

const reduce = playbackReducer(timeline);
const run = (state: PlaybackState, ...actions: PlaybackAction[]) => actions.reduce(reduce, state);

describe('timeline helpers', () => {
  it('clamps years into range', () => {
    expect(clampYear(timeline, 390)).toBe(400);
    expect(clampYear(timeline, 999)).toBe(410);
    expect(clampYear(timeline, Number.NaN)).toBe(400);
    expect(clampYear(timeline, 404.6)).toBe(405);
  });

  it('finds the latest event at or before a year', () => {
    expect(eventIndexAtYear(timeline, 401)).toBe(-1);
    expect(eventIndexAtYear(timeline, 405)).toBe(2);
    expect(eventIndexAtYear(timeline, 410)).toBe(3);
    expect(eventsInYear(timeline, 405).map((e) => e.id)).toEqual(['b', 'c']);
  });

  it('scales the tick interval with speed', () => {
    expect(tickInterval(1)).toBe(700);
    expect(tickInterval(2)).toBe(350);
    expect(tickInterval(0.5)).toBe(1400);
  });
});

describe('playbackReducer', () => {
  it('opens on the first event of the start year', () => {
    const state = initialPlaybackState(timeline, 405);
    expect(state.year).toBe(405);
    expect(state.eventIndex).toBe(1);
    expect(state.playing).toBe(false);
  });

  it('steps through events, including events that share a year', () => {
    const start = initialPlaybackState(timeline);
    expect(start.eventIndex).toBe(-1);
    const s1 = run(start, { type: 'nextEvent' });
    expect([s1.year, s1.eventIndex]).toEqual([402, 0]);
    const s2 = run(s1, { type: 'nextEvent' }, { type: 'nextEvent' });
    expect([s2.year, s2.eventIndex]).toEqual([405, 2]);
    const s3 = run(s2, { type: 'previousEvent' });
    expect(s3.eventIndex).toBe(1);
  });

  it('does not move past the first or last event', () => {
    const last = run(initialPlaybackState(timeline), { type: 'goToEvent', index: 99 });
    expect(last.eventIndex).toBe(3);
    expect(run(last, { type: 'nextEvent' })).toBe(last);
    const first = run(last, { type: 'goToEvent', index: -5 });
    expect(first.eventIndex).toBe(0);
    expect(run(first, { type: 'previousEvent' })).toBe(first);
  });

  it('advances one year per tick only while playing and stops at the end', () => {
    const paused = run(initialPlaybackState(timeline, 408), { type: 'tick' });
    expect(paused.year).toBe(408);
    const playing = run(initialPlaybackState(timeline, 408), { type: 'play' }, { type: 'tick' });
    expect([playing.year, playing.eventIndex, playing.playing]).toEqual([409, 3, true]);
    const end = run(playing, { type: 'tick' });
    expect([end.year, end.playing]).toEqual([410, false]);
  });

  it('restarts from the beginning when played at the end, keeping the speed', () => {
    const end = run(initialPlaybackState(timeline, 410), { type: 'setSpeed', speed: 2 }, { type: 'play' });
    expect([end.year, end.playing, end.speed]).toEqual([400, true, 2]);
  });

  it('jumping to an event pauses playback', () => {
    const state = run(initialPlaybackState(timeline), { type: 'play' }, { type: 'goToEvent', index: 1 });
    expect(state.playing).toBe(false);
  });

  it('reset returns to the start year', () => {
    const state = run(initialPlaybackState(timeline, 409), { type: 'reset' });
    expect(state.year).toBe(400);
  });
});

describe('actual-history data is immutable', () => {
  it('cannot be modified at runtime', () => {
    const event = romeActualTimeline.events[0]!;
    expect(Object.isFrozen(romeActualTimeline)).toBe(true);
    expect(Object.isFrozen(romeActualTimeline.events)).toBe(true);
    expect(Object.isFrozen(event.date)).toBe(true);
    expect(() => {
      (event as { title: string }).title = 'Changed';
    }).toThrow(TypeError);
  });
});
