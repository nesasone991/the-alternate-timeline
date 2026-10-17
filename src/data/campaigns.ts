import type { CampaignSummary } from '../types/campaign';

/**
 * Campaign catalog — the single source of truth for every campaign title, period
 * and availability shown anywhere in the app.
 */
export const campaigns: readonly CampaignSummary[] = [
  {
    id: 'fall-of-rome',
    title: 'The Fall of Rome',
    subtitle: 'Can the West survive?',
    keyYear: 476,
    period: { startYear: 455, endYear: 476, approximate: true },
    description: 'Witness the collapse of the Western Roman Empire, then take control of its fate.',
    status: 'playable',
    difficulty: 'Challenging: few paths keep the empire whole',
    estimatedPlayTime: 'About 10–15 minutes (estimate)',
    disclaimer: 'Real events are sourced. Alternate outcomes are fiction and do not predict what would have happened.',
  },
  {
    id: 'napoleon-1815',
    title: 'Napoleon',
    subtitle: 'The Hundred Days',
    keyYear: 1815,
    period: { startYear: 1815, endYear: 1815, approximate: false },
    description: 'Napoleon’s return from exile and the campaign that ended at Waterloo.',
    status: 'coming-soon',
    disclaimer: 'Concept only. Research and historical review have not started.',
  },
  {
    id: 'viking-age-865',
    title: 'The Viking Age',
    subtitle: 'The Great Army',
    keyYear: 865,
    period: { startYear: 865, endYear: 865, approximate: false },
    description: 'The arrival of a great Viking army in England and the kingdoms that tried to resist it.',
    status: 'coming-soon',
    disclaimer: 'Concept only. Research and historical review have not started.',
  },
];
