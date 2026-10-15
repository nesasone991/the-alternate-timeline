import { campaigns } from '../data/campaigns';
import type { CampaignSummary } from '../types/campaign';

export function listCampaigns(): readonly CampaignSummary[] {
  return campaigns;
}

export function getCampaign(id: string): CampaignSummary | undefined {
  return campaigns.find((campaign) => campaign.id === id);
}

/** A campaign can be opened when it is at least a development preview. */
export function isCampaignSelectable(campaign: CampaignSummary): boolean {
  return campaign.status === 'preview' || campaign.status === 'playable';
}

export function getFeaturedCampaign(): CampaignSummary {
  const featured = campaigns.find(isCampaignSelectable);
  if (!featured) throw new Error('The catalog has no selectable campaign.');
  return featured;
}

export function campaignPath(id: string): string {
  return `/campaigns/${encodeURIComponent(id)}`;
}

export function workspacePath(id: string): string {
  return `${campaignPath(id)}/workspace`;
}
