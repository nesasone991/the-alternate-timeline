import { RELEASE, isBeta } from '../../config/release';

/** A slim, always-visible label on beta builds, with the questionnaire link when one is configured. */
export function BetaNotice() {
  if (!isBeta) return null;
  return (
    <div className="border-b border-gold/30 bg-gold/10" data-testid="beta-notice">
      <div className="container-page flex flex-wrap items-center gap-x-4 gap-y-1 py-1.5 font-sans text-sm">
        <p>
          <span className="font-semibold text-gold">Private beta.</span>{' '}
          <span className="text-parchment-muted">
            Please keep this link private. Saved games may be reset between versions.
          </span>
        </p>
        {RELEASE.feedbackUrl ? (
          <a
            href={RELEASE.feedbackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link inline-flex min-h-11 items-center"
          >
            Give feedback (2 minutes)
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        ) : null}
      </div>
    </div>
  );
}
