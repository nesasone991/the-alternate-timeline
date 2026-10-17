import { Link, useParams } from 'react-router';
import { PageHeader } from '../components/layout/PageHeader';
import { CampaignStatusBadge, FeatureStatusBadge, FictionBadge, SourcedHistoryBadge } from '../components/ui/Badges';
import { getCampaignContent } from '../data/scenarios';
import { EventEntry } from '../features/history/EventEntry';
import { SourceLinks } from '../features/history/SourceLinks';
import { useSettings } from '../features/settings/useSettings';
import { getCampaign, isCampaignSelectable, workspacePath } from '../lib/catalog';
import { formatPeriod, formatYear } from '../lib/dates';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { RESOURCE_KEYS, RESOURCE_LABELS } from '../types/simulation';
import { NotFoundPage } from './NotFoundPage';

export function CampaignOverviewPage() {
  const { campaignId = '' } = useParams();
  const campaign = getCampaign(campaignId);
  const content = campaign ? getCampaignContent(campaign.id) : undefined;
  const { eraNotation } = useSettings();
  useDocumentTitle(campaign?.title ?? 'Campaign not found');

  if (!campaign) return <NotFoundPage />;

  if (!isCampaignSelectable(campaign) || !content) {
    return (
      <>
        <PageHeader
          title={campaign.title}
          lead={<p>This campaign is not available yet. {campaign.disclaimer}</p>}
        >
          <div className="mt-6">
            <CampaignStatusBadge status={campaign.status} />
          </div>
          <Link to="/explore" className="btn btn-secondary mt-8">
            Back to all campaigns
          </Link>
        </PageHeader>
      </>
    );
  }

  const timeline = content.actualTimeline;
  const realMode = content.modes.find((mode) => mode.mode === 'real');
  const alternateMode = content.modes.find((mode) => mode.mode === 'alternate');

  return (
    <>
      <PageHeader title={`${campaign.title} — ${formatYear(campaign.keyYear, eraNotation)}`}>
        <p className="mt-4 text-[clamp(1.25rem,2.6vw,1.625rem)] text-gold italic">{campaign.subtitle}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <CampaignStatusBadge status={campaign.status} />
        </div>
        <dl className="mt-8 grid max-w-3xl grid-cols-2 gap-x-6 gap-y-4 font-sans text-sm sm:grid-cols-4">
          <div>
            <dt className="text-parchment-muted">Playable period</dt>
            <dd className="mt-1 text-parchment">{formatPeriod(campaign.period, eraNotation)}</dd>
          </div>
          <div>
            <dt className="text-parchment-muted">Historical context</dt>
            <dd className="mt-1 text-parchment">
              {timeline.startYear}–{timeline.endYear} {eraNotation}
            </dd>
          </div>
          <div>
            <dt className="text-parchment-muted">Play time</dt>
            <dd className="mt-1 text-parchment">{campaign.estimatedPlayTime ?? 'Not set'}</dd>
          </div>
          <div>
            <dt className="text-parchment-muted">Difficulty</dt>
            <dd className="mt-1 text-parchment">{campaign.difficulty ?? 'Not set'}</dd>
          </div>
        </dl>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link to={workspacePath(campaign.id)} className="btn btn-primary">
            Open the workspace
          </Link>
          <p className="font-sans text-sm text-parchment-muted">
            The sourced timeline and all five decisions work. The map and the side-by-side comparison come later.
          </p>
        </div>
      </PageHeader>

      <div className="container-page grid gap-16 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          <section aria-labelledby="intro-title">
            <h2 id="intro-title" className="text-[clamp(1.5rem,3.5vw,2.125rem)] text-parchment">
              The crisis of the West
            </h2>
            <div className="prose-atlas mt-5">
              {content.introduction.map((paragraph) => (
                <p key={paragraph.slice(0, 32)}>{paragraph}</p>
              ))}
            </div>
            {content.continuityNote ? (
              <aside className="plate mt-8 max-w-[38rem] p-6" aria-label="The Eastern Roman Empire">
                <h3 className="text-lg text-parchment">Rome did not end in 476</h3>
                <p className="mt-2">{content.continuityNote.text}</p>
                <div className="mt-3">
                  <SourceLinks sourceIds={content.continuityNote.sourceIds} sources={content.sources} compact />
                </div>
              </aside>
            ) : null}
          </section>

          <section aria-labelledby="modes-title" className="mt-16">
            <h2 id="modes-title" className="text-[clamp(1.5rem,3.5vw,2.125rem)] text-parchment">
              Two ways to see it
            </h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {realMode ? (
                <div className="border-t-2 border-teal-bright/70 pt-5">
                  <SourcedHistoryBadge />
                  <h3 className="mt-3 text-xl text-parchment">{realMode.label}</h3>
                  <p className="mt-2">{realMode.description}</p>
                  {realMode.limitation ? (
                    <p className="mt-3 font-sans text-sm text-parchment-muted">{realMode.limitation}</p>
                  ) : null}
                </div>
              ) : null}
              {alternateMode ? (
                <div className="border-t-2 border-dashed border-burgundy-bright/70 pt-5">
                  <FictionBadge />
                  <h3 className="mt-3 text-xl text-parchment">{alternateMode.label}</h3>
                  <p className="mt-2">{alternateMode.description}</p>
                  {alternateMode.limitation ? (
                    <p className="mt-3 font-sans text-sm text-parchment-muted">{alternateMode.limitation}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
            <p className="mt-8 max-w-[38rem]">{content.playerRole}</p>
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Campaign resources">
              {RESOURCE_KEYS.map((key) => (
                <li key={key} className="badge badge-unavailable">
                  {RESOURCE_LABELS[key]}
                </li>
              ))}
            </ul>
            <p className="mt-4 max-w-[38rem] font-sans text-sm text-parchment-muted">{content.counterfactualNotice}</p>
          </section>

          <section aria-labelledby="context-title" className="mt-16">
            <h2 id="context-title" className="text-[clamp(1.5rem,3.5vw,2.125rem)] text-parchment">
              Key historical context
            </h2>
            <p className="mt-3 max-w-[38rem] text-parchment-muted">
              The baseline every alternate timeline is measured against. Draft wording, pending independent
              historical review.
            </p>
            <ol className="mt-8 border-l border-rule/60">
              {timeline.events.map((event) => (
                <li key={event.id} className="relative pb-10 pl-6 last:pb-0 sm:pl-8">
                  <span
                    aria-hidden="true"
                    className={`absolute top-1.5 -left-[5px] size-[9px] rounded-full ${
                      event.role === 'context' ? 'border border-rule bg-ink' : 'bg-gold'
                    }`}
                  />
                  <EventEntry event={event} sources={content.sources} era={eraNotation} />
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside aria-labelledby="features-title" className="lg:sticky lg:top-24 lg:self-start">
          <h2 id="features-title" className="text-xl text-parchment">
            What you will be able to do
          </h2>
          <ul className="mt-5 space-y-5">
            {content.features.map((feature) => (
              <li key={feature.id} className="border-t border-rule-soft pt-4">
                <FeatureStatusBadge status={feature.status} phase={feature.plannedPhase} />
                <h3 className="mt-2 text-lg text-parchment">{feature.title}</h3>
                <p className="mt-1 text-[0.9375rem] text-parchment-muted">{feature.description}</p>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  );
}
