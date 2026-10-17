import { Link } from 'react-router';
import { BRAND, configuredChannels } from '../../config/brand';
import { APP_VERSION, RELEASE, isBeta } from '../../config/release';

export function SiteFooter() {
  const channels = configuredChannels();
  return (
    <footer className="mt-24 border-t border-rule-soft">
      <div className="container-page grid gap-8 py-10 font-sans text-sm text-parchment-muted md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="font-serif text-base text-parchment">{BRAND.byline}</p>
          <p className="mt-2 max-w-xl">
            Real events are presented with sources. Alternate outcomes are fiction, written to be internally
            consistent, never to predict what would have happened.
          </p>
          <p className="mt-2 text-xs" data-testid="build-label">
            {isBeta ? 'Private beta' : 'Version'} {APP_VERSION}
            {RELEASE.commit ? `, build ${RELEASE.commit}` : ''}
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {channels.map((channel) => (
              <li key={channel.id}>
                <a href={channel.url} className="text-link" rel="noopener noreferrer" target="_blank">
                  {channel.label}
                </a>
              </li>
            ))}
            <li>
              <Link to="/about" className="text-link">
                Sources and limitations
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="text-link">
                Privacy
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
