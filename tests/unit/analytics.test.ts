import { afterEach, describe, expect, it } from 'vitest';
import { romeAlternateScenario as rome } from '../../src/data/scenarios/rome/alternate';
import {
  ANALYTICS_EVENTS,
  __resetAnalyticsForTests,
  __setAnalyticsForTests,
  eventUrl,
  statusFor,
  trackEvent,
  type AnalyticsEvent,
} from '../../src/lib/analytics';

const ENDPOINT = 'https://example.goatcounter.com/count';
const ACTIVE = { endpoint: ENDPOINT, allowedBySettings: true, doNotTrack: false, automated: false };

afterEach(() => __resetAnalyticsForTests());

describe('analytics status', () => {
  it('is active only with an endpoint, consent in Settings, no Do Not Track and a real browser', () => {
    expect(statusFor(ACTIVE)).toBe('active');
    expect(statusFor({ ...ACTIVE, endpoint: '' })).toBe('not-configured');
    expect(statusFor({ ...ACTIVE, allowedBySettings: false })).toBe('turned-off');
    expect(statusFor({ ...ACTIVE, doNotTrack: true })).toBe('do-not-track');
    expect(statusFor({ ...ACTIVE, automated: true })).toBe('automated');
  });

  it('is off in this test build, where no endpoint is configured', () => {
    const sent: string[] = [];
    __setAnalyticsForTests({ transport: (url) => sent.push(url) });
    expect(trackEvent('campaign-start')).toBe(false);
    expect(sent).toEqual([]);
  });
});

describe('analytics events', () => {
  it('builds a GoatCounter event request with the event name and title only', () => {
    const url = new URL(eventUrl(ENDPOINT, 'decision-3-complete', 'k2x9'));
    expect(url.origin + url.pathname).toBe(ENDPOINT);
    expect([...url.searchParams.keys()]).toEqual(['p', 't', 'e', 'rnd']);
    expect(url.searchParams.get('p')).toBe('decision-3-complete');
    expect(url.searchParams.get('t')).toBe('Decision 3 was completed');
    expect(url.searchParams.get('e')).toBe('true');
  });

  it('sends one request per allowed event and nothing when blocked', () => {
    const sent: { url: string; event: AnalyticsEvent }[] = [];
    __setAnalyticsForTests({ transport: (url, event) => sent.push({ url, event }), environment: ACTIVE });
    expect(trackEvent('campaign-complete')).toBe(true);
    expect(sent).toHaveLength(1);
    expect(sent[0]!.event).toBe('campaign-complete');
    expect(sent[0]!.url).toMatch(/^https:\/\/example\.goatcounter\.com\/count\?p=campaign-complete&t=[^&]+&e=true&rnd=[a-z0-9]+$/);

    for (const blocked of [
      { ...ACTIVE, endpoint: '' },
      { ...ACTIVE, allowedBySettings: false },
      { ...ACTIVE, doNotTrack: true },
      { ...ACTIVE, automated: true },
    ]) {
      __setAnalyticsForTests({ environment: blocked });
      expect(trackEvent('replay-start')).toBe(false);
    }
    expect(sent).toHaveLength(1);
  });

  it('never throws, even if sending fails', () => {
    __setAnalyticsForTests({
      transport: () => {
        throw new Error('offline');
      },
      environment: ACTIVE,
    });
    expect(trackEvent('replay-start')).toBe(false);
  });

  it('has an event for every ending category of the campaign, and only the documented events', () => {
    for (const ending of rome.endings ?? []) expect(Object.keys(ANALYTICS_EVENTS)).toContain(`ending-${ending.category}`);
    expect(Object.keys(ANALYTICS_EVENTS).sort()).toEqual(
      [
        'campaign-complete',
        'campaign-start',
        'decision-1-complete',
        'decision-3-complete',
        'ending-fragmented-survival',
        'ending-imperial-collapse',
        'ending-imperial-survival',
        'new-timeline-from-ending',
        'new-timeline-from-workspace',
        'replay-start',
      ].sort(),
    );
  });
});
