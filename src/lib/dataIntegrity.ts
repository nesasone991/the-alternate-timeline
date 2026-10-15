import { campaigns } from '../data/campaigns';
import { getCampaignContent, listCampaignContentIds } from '../data/scenarios';
import { validateCatalog, validateTimeline } from './validation';

/** Every data-integrity problem across the catalog and all campaign content. */
export function collectDataIntegrityErrors(): string[] {
  const errors = [...validateCatalog(campaigns)];
  for (const id of listCampaignContentIds()) {
    const content = getCampaignContent(id);
    if (!content) continue;
    if (!campaigns.some((campaign) => campaign.id === id)) {
      errors.push(`Content "${id}" has no catalog entry.`);
    }
    errors.push(...validateTimeline(content.actualTimeline, content.sources));
  }
  for (const campaign of campaigns) {
    if (campaign.status !== 'coming-soon' && !getCampaignContent(campaign.id)) {
      errors.push(`Campaign "${campaign.id}" is selectable but has no content.`);
    }
  }
  return errors;
}

/** Development-only console report; the unit tests enforce the same checks. */
export function reportDataIntegrity(): void {
  const errors = collectDataIntegrityErrors();
  if (errors.length > 0) console.error('Data integrity problems:\n' + errors.join('\n'));
}
