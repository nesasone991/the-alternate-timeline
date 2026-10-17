import { describe, expect, it } from 'vitest';
import {
  contentSecurityPolicy,
  headersFile,
  resolveReleaseConfig,
  robotsFile,
  robotsMeta,
} from '../../scripts/release.mjs';
import packageJson from '../../package.json';
import { APP_VERSION, RELEASE } from '../../src/config/release';

describe('release configuration', () => {
  it('defaults to a private beta with analytics and feedback off', () => {
    expect(resolveReleaseConfig({})).toEqual({ channel: 'beta', analyticsEndpoint: '', feedbackUrl: '', errors: [] });
  });

  it('rejects unknown channels, non-GoatCounter endpoints and non-https feedback links', () => {
    const config = resolveReleaseConfig({
      VITE_RELEASE_CHANNEL: 'staging',
      VITE_ANALYTICS_ENDPOINT: 'https://tracker.example.com/collect',
      VITE_FEEDBACK_URL: 'http://forms.example.com/beta',
    });
    expect(config.errors).toHaveLength(3);
    expect(config.channel).toBe('beta');
    expect(config.analyticsEndpoint).toBe('');
    expect(config.feedbackUrl).toBe('');
  });

  it('accepts a GoatCounter endpoint and an https feedback link', () => {
    const config = resolveReleaseConfig({
      VITE_RELEASE_CHANNEL: 'production',
      VITE_ANALYTICS_ENDPOINT: 'https://tat-beta.goatcounter.com/count',
      VITE_FEEDBACK_URL: 'https://forms.example.com/beta',
    });
    expect(config).toEqual({
      channel: 'production',
      analyticsEndpoint: 'https://tat-beta.goatcounter.com/count',
      feedbackUrl: 'https://forms.example.com/beta',
      errors: [],
    });
  });
});

describe('generated hosting files', () => {
  const beta = resolveReleaseConfig({});
  const production = resolveReleaseConfig({ VITE_RELEASE_CHANNEL: 'production' });
  const counted = resolveReleaseConfig({ VITE_ANALYTICS_ENDPOINT: 'https://tat-beta.goatcounter.com/count' });

  it('keeps the beta out of search engines three ways; production is indexable', () => {
    expect(headersFile(beta)).toContain('X-Robots-Tag: noindex, nofollow');
    expect(robotsFile(beta)).toContain('Disallow: /');
    expect(robotsMeta(beta)).toBe('noindex, nofollow');
    expect(headersFile(production)).not.toContain('X-Robots-Tag');
    expect(robotsFile(production)).toContain('Allow: /');
    expect(robotsMeta(production)).toBeNull();
  });

  it('allows connections only to the site itself, plus the analytics origin when configured', () => {
    expect(contentSecurityPolicy(beta)).toContain("connect-src 'self';");
    expect(contentSecurityPolicy(counted)).toContain("connect-src 'self' https://tat-beta.goatcounter.com;");
    for (const config of [beta, counted]) {
      const csp = contentSecurityPolicy(config);
      expect(csp).toContain("script-src 'self';");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).not.toContain('unsafe-eval');
    }
  });

  it('caches hashed assets for a year and applies security headers to every path', () => {
    const file = headersFile(beta);
    expect(file).toMatch(/^\/\*$/m);
    expect(file).toMatch(/^\/assets\/\*\n {2}Cache-Control: public, max-age=31536000, immutable$/m);
    for (const header of ['Content-Security-Policy', 'X-Content-Type-Options: nosniff', 'Referrer-Policy', 'X-Frame-Options: DENY']) {
      expect(file).toContain(header);
    }
    // Cloudflare Pages limits: 100 rules, 2,000 characters per line.
    expect(file.split('\n').every((line) => line.length <= 2000)).toBe(true);
  });
});

describe('build label', () => {
  it('matches package.json and this test build is a beta without analytics', () => {
    expect(APP_VERSION).toBe(packageJson.version);
    expect(RELEASE.channel).toBe('beta');
    expect(RELEASE.analyticsEndpoint).toBe('');
  });
});
