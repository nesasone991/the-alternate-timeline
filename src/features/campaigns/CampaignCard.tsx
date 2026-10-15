import { Link } from 'react-router';
import { CampaignStatusBadge } from '../../components/ui/Badges';
import { Icon } from '../../components/ui/Icon';
import { campaignPath, isCampaignSelectable } from '../../lib/catalog';
import { formatPeriod } from '../../lib/dates';
import type { CampaignSummary } from '../../types/campaign';
import { useSettings } from '../settings/useSettings';
import { CampaignEmblem } from './CampaignEmblem';

/**
 * A campaign in the explorer. Selectable campaigns get one real link; unavailable
 * campaigns get no button at all, only a clear status.
 */
export function CampaignCard({ campaign }: { campaign: CampaignSummary }) {
  const { eraNotation } = useSettings();
  const selectable = isCampaignSelectable(campaign);
  const headingId = `campaign-${campaign.id}-title`;

  return (
    <article aria-labelledby={headingId} className={`plate flex flex-col ${selectable ? '' : 'plate-muted'}`}>
      <CampaignEmblem year={campaign.keyYear} muted={!selectable} />
      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center gap-2">
          <CampaignStatusBadge status={campaign.status} />
        </div>
        <h3 id={headingId} className="inscription mt-4 text-2xl text-parchment">
          {campaign.title}
        </h3>
        <p className="mt-1 font-sans text-sm text-parchment-muted">
          {campaign.subtitle} <span aria-hidden="true">/</span>{' '}
          <span className="whitespace-nowrap">{formatPeriod(campaign.period, eraNotation)}</span>
        </p>
        <p className="mt-4 text-[1.0625rem]">{campaign.description}</p>

        {selectable ? (
          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 font-sans text-sm">
            <dt className="text-parchment-muted">Play time</dt>
            <dd>{campaign.estimatedPlayTime ?? 'Not set'}</dd>
            <dt className="text-parchment-muted">Difficulty</dt>
            <dd>{campaign.difficulty ?? 'Not set'}</dd>
          </dl>
        ) : null}

        <p className="mt-5 border-l-2 border-rule pl-3 font-sans text-sm text-parchment-muted">{campaign.disclaimer}</p>

        <div className="mt-auto pt-6">
          {selectable ? (
            <Link to={campaignPath(campaign.id)} className="btn btn-primary w-full sm:w-auto">
              Explore campaign
            </Link>
          ) : (
            <p className="flex items-center gap-2 font-sans text-sm text-parchment-muted">
              <Icon name="lock" size={18} />
              Not yet available
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
