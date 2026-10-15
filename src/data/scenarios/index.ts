import type { CampaignFeature } from '../../types/campaign';
import type { Source, Timeline } from '../../types/history';
import type { ModeAvailability } from '../../types/simulation';
import { romeActualTimeline, easternContinuityNote } from './rome/history';
import { romeFeatures, romeModes, romeOverview } from './rome/overview';
import { romeSources } from './rome/sources';

/** Everything a campaign's overview and workspace need, keyed by campaign id. */
export type CampaignContent = {
  readonly campaignId: string;
  readonly introduction: readonly string[];
  readonly playerRole: string;
  readonly counterfactualNotice: string;
  readonly continuityNote?: { readonly text: string; readonly sourceIds: readonly string[] };
  readonly actualTimeline: Timeline;
  readonly sources: readonly Source[];
  readonly modes: readonly ModeAvailability[];
  readonly features: readonly CampaignFeature[];
};

const contentById: Readonly<Record<string, CampaignContent>> = {
  'fall-of-rome': {
    campaignId: 'fall-of-rome',
    introduction: romeOverview.introduction,
    playerRole: romeOverview.playerRole,
    counterfactualNotice: romeOverview.counterfactualNotice,
    continuityNote: easternContinuityNote,
    actualTimeline: romeActualTimeline,
    sources: romeSources,
    modes: romeModes,
    features: romeFeatures,
  },
};

export function getCampaignContent(campaignId: string): CampaignContent | undefined {
  return Object.prototype.hasOwnProperty.call(contentById, campaignId) ? contentById[campaignId] : undefined;
}

export function listCampaignContentIds(): string[] {
  return Object.keys(contentById);
}
