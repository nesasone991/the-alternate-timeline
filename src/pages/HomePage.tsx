import { Link } from 'react-router';
import { CampaignStatusBadge } from '../components/ui/Badges';
import { BRAND } from '../config/brand';
import { getCampaignContent } from '../data/scenarios';
import { CampaignCard } from '../features/campaigns/CampaignCard';
import { ForkingTimeline } from '../features/home/ForkingTimeline';
import { HowItWorksSteps } from '../features/home/HowItWorksSteps';
import { useSettings } from '../features/settings/useSettings';
import { campaignPath, getFeaturedCampaign, listCampaigns } from '../lib/catalog';
import { formatYear } from '../lib/dates';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export function HomePage() {
  useDocumentTitle();
  const { eraNotation } = useSettings();
  const featured = getFeaturedCampaign();
  const content = getCampaignContent(featured.id);
  const comingSoon = listCampaigns().filter((campaign) => campaign.status === 'coming-soon');
  const keyEvents = content?.actualTimeline.events.filter((event) => event.role !== 'context') ?? [];

  return (
    <>
      {/* Hero */}
      <section aria-labelledby="hero-title" className="container-page pt-14 pb-10 sm:pt-24">
        <h1 id="hero-title" className="inscription max-w-4xl text-[clamp(2.25rem,8vw,5.25rem)] text-parchment">
          The Alternate Timeline
        </h1>
        <p className="mt-6 max-w-2xl text-[clamp(1.375rem,3.2vw,2rem)] leading-snug text-gold italic">
          {BRAND.tagline}
        </p>
        <p className="prose-atlas mt-5 text-parchment-muted">
          Explore the events that shaped our world. Change pivotal decisions. Discover how history might have
          unfolded differently.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link to="/explore" className="btn btn-primary">
            Explore History
          </Link>
          <Link to="/how-it-works" className="btn btn-secondary">
            How It Works
          </Link>
        </div>

        {content ? (
          <div className="mt-14 sm:mt-20">
            <ForkingTimeline
              events={content.actualTimeline.events.filter((event) => event.date.year <= 476)}
              forkYear={featured.period.startYear}
              fromYear={405}
              toYear={480}
              compactYears={[410, 455, 476]}
            />
          </div>
        ) : null}
      </section>

      {/* Featured campaign */}
      <section aria-labelledby="featured-title" className="container-page mt-16">
        <div className="plate grid gap-0 lg:grid-cols-[1.15fr_1fr]">
          <div className="p-6 sm:p-10">
            <CampaignStatusBadge status={featured.status} />
            <h2 id="featured-title" className="inscription mt-5 text-[clamp(1.875rem,5vw,3rem)] text-parchment">
              {featured.title}
            </h2>
            <p className="inscription mt-3 text-xl text-gold">{formatYear(featured.keyYear, eraNotation)}</p>
            <p className="prose-atlas mt-5">{featured.description}</p>
            <p className="mt-4 font-sans text-sm text-parchment-muted">{featured.disclaimer}</p>
            <Link to={campaignPath(featured.id)} className="btn btn-primary mt-8">
              Explore Campaign
            </Link>
          </div>

          {keyEvents.length > 0 ? (
            <div className="border-t border-rule/40 p-6 sm:p-10 lg:border-t-0 lg:border-l">
              <h3 className="font-sans text-sm font-semibold text-parchment-muted">
                What actually happened, {keyEvents[0]?.date.year} to {keyEvents[keyEvents.length - 1]?.date.year}
              </h3>
              <ol className="mt-4 space-y-3">
                {keyEvents.map((event) => (
                  <li key={event.id} className="grid grid-cols-[4.5rem_1fr] gap-3 border-t border-rule-soft pt-3">
                    <span className="inscription text-sm leading-6 text-gold">{event.date.year}</span>
                    <span className="leading-6">{event.title}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-5 font-sans text-sm text-parchment-muted">
                Sources for each event are listed on the campaign page.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-title" className="container-page mt-24">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 id="how-title" className="text-[clamp(1.75rem,4vw,2.5rem)] text-parchment">
            How it works
          </h2>
          <Link to="/how-it-works" className="text-link font-sans text-sm">
            Read the full explanation
          </Link>
        </div>
        <div className="mt-8">
          <HowItWorksSteps />
        </div>
      </section>

      {/* Coming soon */}
      {comingSoon.length > 0 ? (
        <section aria-labelledby="soon-title" className="container-page mt-24">
          <h2 id="soon-title" className="text-[clamp(1.75rem,4vw,2.5rem)] text-parchment">
            Coming later
          </h2>
          <p className="mt-2 max-w-2xl text-parchment-muted">
            Future campaigns. These are concepts only and cannot be played yet.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {comingSoon.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
