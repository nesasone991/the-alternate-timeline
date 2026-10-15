import { PageHeader } from '../components/layout/PageHeader';
import { SETTINGS_STORAGE_KEY } from '../features/settings/settings';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export function PrivacyPage() {
  useDocumentTitle('Privacy');
  return (
    <>
      <PageHeader title="Privacy" lead={<p>No account, no tracking, no advertising.</p>} />
      <div className="container-page">
        <div className="prose-atlas">
          <h2 className="text-2xl text-parchment">What is stored on your device</h2>
          <p>
            Your settings (motion, ambient animation, sound, text size and year notation) are saved in this browser’s
            local storage under the key <code className="font-sans text-sm">{SETTINGS_STORAGE_KEY}</code>. They never
            leave your device. Clearing your browser’s site data removes them.
          </p>
          <h2 className="mt-10 text-2xl text-parchment">What is not collected</h2>
          <p>
            The site uses no cookies, no analytics, no advertising and no third-party scripts or fonts. Links to
            sources open the external site in a new tab, where that site’s own policy applies.
          </p>
          <h2 className="mt-10 text-2xl text-parchment">Hosting</h2>
          <p>
            Like any website, the hosting provider may keep standard server logs, such as IP addresses and the pages
            requested, for security and operation. This page will name the provider and link its policy once the
            site is deployed.
          </p>
        </div>
      </div>
    </>
  );
}
