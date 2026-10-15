import { describe, expect, it } from 'vitest';
import { romeAlternateScenario as rome } from '../../src/data/scenarios/rome/alternate';
import { enumeratePaths, replay } from '../../src/features/simulation/engine';
import { replayWithEvents } from '../../src/features/simulation/storyEvents';
import { SCHEMATIC_REGIONS } from '../../src/types/map';

describe('replayWithEvents (data for the future Animation Studio)', () => {
  const path = ['reform-taxation', 'field-army', 'join-expedition'];

  it('lists decisions and consequences in the order they happen', () => {
    const { events } = replayWithEvents(rome, path);
    expect(events.map((e) => (e.kind === 'decision' ? `decide:${e.decisionId}` : `${e.year}:${e.consequenceId}`))).toEqual([
      'decide:d1-fiscal-survival',
      '459:tax-reform-revenue',
      'decide:d2-border-defence',
      '468:tax-reform-landowners',
      '468:field-army-upkeep',
      '468:field-army-victories',
      'decide:d3-north-africa',
    ]);
    expect(events.map((e) => e.sequence)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    for (let i = 1; i < events.length; i += 1) expect(events[i]!.year).toBeGreaterThanOrEqual(events[i - 1]!.year);
    expect(events.every((e) => e.fiction)).toBe(true);
  });

  it('places the 468 consequences before Decision 3, which happens in the same year', () => {
    const { events } = replayWithEvents(rome, path);
    const d3 = events.findIndex((e) => e.kind === 'decision' && e.decisionId === 'd3-north-africa');
    const due468 = events.filter((e) => e.kind === 'consequence' && e.year === 468);
    expect(due468.length).toBe(3);
    for (const e of due468) expect(e.sequence).toBeLessThan(events[d3]!.sequence);
    expect(events[d3]!.year).toBe(468);
  });

  it('gives the same final state as replay() and is fully deterministic', () => {
    for (const p of enumeratePaths(rome)) {
      const a = replayWithEvents(rome, p);
      expect(JSON.stringify(a.state)).toBe(JSON.stringify(replay(rome, p)));
      expect(JSON.stringify(a)).toBe(JSON.stringify(replayWithEvents(rome, p)));
    }
  });

  it('carries map cues only on known schematic regions, and none for lapsed consequences', () => {
    const regions = new Set<string>(SCHEMATIC_REGIONS);
    for (const p of enumeratePaths(rome)) {
      for (const e of replayWithEvents(rome, p).events) {
        for (const cue of e.mapCues) for (const r of cue.regions) expect(regions.has(r)).toBe(true);
        if (e.kind === 'consequence' && !e.triggered) expect(e.mapCues).toEqual([]);
        if (e.kind === 'decision') expect(e.mapCues.length).toBeGreaterThan(0);
      }
    }
    const lapsed = replayWithEvents(rome, ['reform-taxation', 'hold-italy']).events.find(
      (e) => e.kind === 'consequence' && e.consequenceId === 'tax-reform-landowners',
    );
    expect(lapsed?.kind === 'consequence' && lapsed.triggered).toBe(false);
  });

  it('includes the resolved narrative for Decision 3, chosen from the state before the choice', () => {
    const { events } = replayWithEvents(rome, ['pay-the-armies', 'hold-italy', 'join-expedition']);
    const d3 = events.at(-1);
    expect(d3?.kind).toBe('decision');
    if (d3?.kind !== 'decision') return;
    expect(d3.narrative?.ordered).toMatch(/^You /);
    expect(d3.narrative?.stakeholders.some((s) => s.impact === 'gains')).toBe(true);
    expect(d3.narrative?.stakeholders.some((s) => s.impact === 'loses')).toBe(true);
  });

  it('rejects an invalid path instead of inventing events', () => {
    expect(() => replayWithEvents(rome, ['reform-taxation', 'hold-italy', 'join-expedition'])).toThrow();
  });
});
