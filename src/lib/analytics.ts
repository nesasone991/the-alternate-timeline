import { RELEASE } from '../config/release';
import { getSettings } from '../features/settings/settingsStore';

/**
 * Privacy-conscious usage counts.
 *
 * Only these named events exist. Each one is sent as a bare count to the
 * configured GoatCounter endpoint: the event name and a short title, nothing
 * else — no decisions, no resources, no saved game, no identifier, no
 * referrer, no screen size. Nothing is stored on the device for analytics.
 *
 * Nothing is sent when: no endpoint is configured for this build; the player
 * turned usage counts off in Settings; the browser sends Do Not Track or
 * Global Privacy Control; or the browser is automated (tests, crawlers).
 */
export const ANALYTICS_EVENTS = {
  'campaign-start': 'A campaign was started',
  'decision-1-complete': 'Decision 1 was completed',
  'decision-3-complete': 'Decision 3 was completed',
  'campaign-complete': 'A campaign reached its ending',
  'ending-imperial-survival': 'Ending: Imperial Survival',
  'ending-fragmented-survival': 'Ending: Fragmented Survival',
  'ending-imperial-collapse': 'Ending: Imperial Collapse',
  'replay-start': 'Replay was opened on the ending page',
  'new-timeline-from-ending': 'A new timeline was started from the ending page',
  'new-timeline-from-workspace': 'A campaign was started over from the workspace',
} as const;

export type AnalyticsEvent = keyof typeof ANALYTICS_EVENTS;

export type AnalyticsStatus = 'not-configured' | 'turned-off' | 'do-not-track' | 'automated' | 'active';

type Environment = {
  readonly endpoint: string;
  readonly allowedBySettings: boolean;
  readonly doNotTrack: boolean;
  readonly automated: boolean;
};

export function statusFor(environment: Environment): AnalyticsStatus {
  if (!environment.endpoint) return 'not-configured';
  if (!environment.allowedBySettings) return 'turned-off';
  if (environment.doNotTrack) return 'do-not-track';
  if (environment.automated) return 'automated';
  return 'active';
}

/** The exact request for one event. `nonce` is a cache buster only; it identifies nothing. */
export function eventUrl(endpoint: string, event: AnalyticsEvent, nonce: string): string {
  const params = new URLSearchParams({ p: event, t: ANALYTICS_EVENTS[event], e: 'true', rnd: nonce });
  return `${endpoint}?${params.toString()}`;
}

function currentEnvironment(): Environment {
  const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { globalPrivacyControl?: boolean }) : undefined;
  return {
    endpoint: RELEASE.analyticsEndpoint,
    allowedBySettings: getSettings().usageCounts,
    doNotTrack: nav?.doNotTrack === '1' || nav?.globalPrivacyControl === true,
    automated: nav?.webdriver === true,
  };
}

export function analyticsStatus(): AnalyticsStatus {
  return statusFor(currentEnvironment());
}

type Transport = (url: string, event: AnalyticsEvent) => void;

const fetchTransport: Transport = (url) => {
  if (typeof fetch !== 'function') return;
  // No cookies, no referrer; keepalive lets the request finish if the page changes.
  void fetch(url, { method: 'GET', mode: 'no-cors', credentials: 'omit', keepalive: true, referrerPolicy: 'no-referrer' }).catch(
    () => undefined,
  );
};

let transport: Transport = fetchTransport;
let environmentOverride: Environment | null = null;

/** Tests only: record events instead of sending them, and fix the environment. */
export function __setAnalyticsForTests(options: { transport?: Transport; environment?: Environment | null }): void {
  if (options.transport) transport = options.transport;
  if (options.environment !== undefined) environmentOverride = options.environment;
}
export function __resetAnalyticsForTests(): void {
  transport = fetchTransport;
  environmentOverride = null;
}

/** Sends one count if allowed. Returns whether it was sent. Never throws. */
export function trackEvent(event: AnalyticsEvent): boolean {
  try {
    const environment = environmentOverride ?? currentEnvironment();
    if (statusFor(environment) !== 'active') return false;
    transport(eventUrl(environment.endpoint, event, Date.now().toString(36)), event);
    return true;
  } catch {
    return false;
  }
}
