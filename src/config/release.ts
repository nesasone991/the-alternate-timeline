/**
 * Public build information, read from Vite's environment at build time.
 * See scripts/release.mjs for the variables and their validation. Nothing
 * here is secret: everything in a static site is visible to its visitors.
 */
const env = (import.meta.env ?? {}) as Record<string, string | boolean | undefined>;

const ENDPOINT_PATTERN = /^https:\/\/[a-z0-9][a-z0-9-]{0,62}\.goatcounter\.com\/count$/;

function text(key: string): string {
  const value = env[key];
  return typeof value === 'string' ? value.trim() : '';
}

function httpsUrl(value: string): string {
  try {
    return new URL(value).protocol === 'https:' ? value : '';
  } catch {
    return '';
  }
}

export type ReleaseChannel = 'beta' | 'production';

export const RELEASE = {
  /** "beta" unless the build says production, so a misconfigured build is never presented as final. */
  channel: (text('VITE_RELEASE_CHANNEL') === 'production' ? 'production' : 'beta') as ReleaseChannel,
  /** GoatCounter count endpoint; empty means analytics are off and nothing is ever sent. */
  analyticsEndpoint: ENDPOINT_PATTERN.test(text('VITE_ANALYTICS_ENDPOINT')) ? text('VITE_ANALYTICS_ENDPOINT') : '',
  /** Link to the beta questionnaire; the link is hidden when empty. */
  feedbackUrl: httpsUrl(text('VITE_FEEDBACK_URL')),
  /** Short commit id of the build, when the build machine provides one. */
  commit: /^[0-9a-f]{7}$/.test(text('VITE_BUILD_COMMIT')) ? text('VITE_BUILD_COMMIT') : '',
} as const;

export const isBeta = RELEASE.channel === 'beta';

/** Shown in the footer so testers can say which build they used. Update with each beta release. */
export const APP_VERSION = '0.9.0-beta.1';
