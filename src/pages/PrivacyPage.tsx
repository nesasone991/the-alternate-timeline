import { PageHeader } from '../components/layout/PageHeader';
import { RELEASE } from '../config/release';
import { SETTINGS_STORAGE_KEY } from '../features/settings/settings';
import { updateSettings } from '../features/settings/settingsStore';
import { useSettings } from '../features/settings/useSettings';
import { saveKey } from '../features/simulation/savegame';
import { ANALYTICS_EVENTS, analyticsStatus, type AnalyticsStatus } from '../lib/analytics';
import { useDocumentTitle } from '../lib/useDocumentTitle';

const STATUS_TEXT: Record<AnalyticsStatus, string> = {
  'not-configured': 'Usage counts are not set up on this version of the site, so nothing is sent.',
  'turned-off': 'You have turned usage counts off, so nothing is sent from this browser.',
  'do-not-track': 'Your browser asks sites not to track you (Do Not Track or Global Privacy Control), so nothing is sent.',
  automated: 'This browser is being controlled by automation software, so nothing is sent.',
  active: 'Usage counts are on in this browser.',
};

const code = 'font-sans text-sm';

export function PrivacyPage() {
  useDocumentTitle('Privacy');
  const settings = useSettings();
  const status = analyticsStatus();
  const configured = RELEASE.analyticsEndpoint !== '';
  const analyticsHost = configured ? new URL(RELEASE.analyticsEndpoint).host : '';

  return (
    <>
      <PageHeader
        title="Privacy"
        lead={<p>No account, no cookies, no advertising, and no record of who you are or what you chose.</p>}
      />
      <div className="container-page">
        <div className="prose-atlas">
          <h2 className="text-2xl text-parchment">What is stored on your device</h2>
          <p>
            Your settings (motion, ambient animation, sound, text size, year notation and whether usage counts are
            allowed) are saved in this browser’s local storage under the key{' '}
            <code className={code}>{SETTINGS_STORAGE_KEY}</code>. They never leave your device.
          </p>
          <p>
            When you play an alternate-history campaign, the list of decisions you have confirmed is saved under{' '}
            <code className={code}>{saveKey('rome-alternate')}</code> so you can continue after a refresh. It stays in
            this browser: it is never uploaded. Starting a new timeline deletes it, and clearing your browser’s data
            for this site removes everything.
          </p>

          <h2 className="mt-10 text-2xl text-parchment" id="usage-counts">
            Anonymous usage counts
          </h2>
          <p data-testid="analytics-status">{STATUS_TEXT[status]}</p>
          <p>
            To learn whether the campaign works for players, this site can count a few moments of play. Each count is a
            single request saying only that one of these things happened:
          </p>
          <ul className="list-disc space-y-1 pl-5" data-testid="analytics-events">
            {Object.values(ANALYTICS_EVENTS).map((title) => (
              <li key={title}>{title}</li>
            ))}
          </ul>
          <p>
            The request carries the name of the moment and nothing else from the site: not your decisions, your
            resources, your saved game, the page you came from or any identifier. Nothing is stored on your device for
            counting. Individual decision histories are never sent anywhere.
          </p>
          {configured ? (
            <p>
              Counts go to GoatCounter ({analyticsHost}), an analytics service that sets no cookies. Like any web
              request, it reaches GoatCounter’s server with your IP address and browser details; GoatCounter says it
              keeps only totals, such as counts by browser, operating system, country and language, does not store IP
              addresses, and holds a temporary visitor mapping in memory for up to eight hours to avoid double counting.
              See{' '}
              <a href="https://www.goatcounter.com/help/privacy" target="_blank" rel="noopener noreferrer" className="text-link">
                GoatCounter’s privacy policy
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              .
            </p>
          ) : null}
          <p>
            Counts are never sent when your browser has Do Not Track or Global Privacy Control turned on
            {configured ? ', or when you turn them off below or in Settings' : ''}.
          </p>
          {configured ? (
            <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 font-sans">
              <input
                type="checkbox"
                className="size-5 accent-gold"
                checked={settings.usageCounts}
                onChange={(event) => updateSettings({ usageCounts: event.target.checked })}
              />
              Allow anonymous usage counts in this browser
            </label>
          ) : null}

          <h2 className="mt-10 text-2xl text-parchment">What is not collected</h2>
          <p>
            There are no accounts, cookies, advertising, social-media widgets or third-party scripts or fonts. Links to
            sources and to the feedback questionnaire open the external site in a new tab, where that site’s own policy
            applies.
          </p>

          <h2 className="mt-10 text-2xl text-parchment">Hosting</h2>
          <p>
            The site is a set of static files served by Cloudflare Pages. Like any web host, Cloudflare processes
            standard request data, such as IP addresses and the pages requested, to deliver the site and protect it
            from abuse. See{' '}
            <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className="text-link">
              Cloudflare’s privacy policy
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            .
          </p>
        </div>
      </div>
    </>
  );
}
