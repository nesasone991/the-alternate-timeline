import type { CampaignFeature } from '../../../types/campaign';
import type { ModeAvailability } from '../../../types/simulation';

/**
 * Overview copy for the Fall of Rome campaign. Historical statements here must be
 * backed by events in ./history.ts and sources in ./sources.ts.
 */
export const romeOverview = {
  introduction: [
    'By the middle of the fifth century the Western Roman Empire was still an empire in name, but its hold on its provinces had loosened. Visigoths, Vandals, Burgundians, Franks and others had settled inside its frontiers — sometimes as allies, sometimes as conquerors — and the loss of North Africa to the Vandals in 439 had cut deep into its revenue.',
    'In 455 the murder of Valentinian III ended the ruling dynasty, and less than three months later the Vandals sacked Rome. Over the next twenty years a succession of short-lived emperors governed an ever smaller territory, often at the mercy of the generals who commanded their armies.',
    'In 476 Odoacer deposed the boy emperor Romulus Augustulus and chose not to replace him. Historians use that year as a convenient marker for the end of the Western Empire — but Roman institutions, law and identity carried on, and the Eastern Empire continued for nearly a thousand years.',
  ],
  playerRole:
    'You will advise the Western imperial court as a fictional council — a gameplay device, not a historical office. Your choices will shape four abstract measures of the state: Economy, Military, Political Unity and Legitimacy.',
  counterfactualNotice:
    'Alternate outcomes in this campaign are fiction. They are authored to be internally consistent, not to predict what would have happened.',
} as const;

export const romeModes: readonly ModeAvailability[] = [
  {
    mode: 'real',
    label: 'Real History',
    description:
      'Follow what actually happened, year by year, with dated events, sources and notes on where historians disagree.',
    available: true,
    limitation: 'The sourced timeline works now. The interactive map arrives in a later phase.',
  },
  {
    mode: 'alternate',
    label: 'Alternate History',
    description:
      'Advise the Western court at five turning points between 455 and 476. Each decision changes your resources, closes some options and opens others.',
    available: false,
    limitation: 'Not built yet. The decision engine is the next development phase.',
  },
  {
    mode: 'comparison',
    label: 'Comparison',
    description:
      'Place your alternate timeline beside the real one at the same date, with fiction clearly marked apart from sourced history.',
    available: false,
    limitation: 'Not built yet. Comparison needs both the decision engine and the map.',
  },
];

export const romeFeatures: readonly CampaignFeature[] = [
  {
    id: 'timeline',
    title: 'Sourced historical timeline',
    description: 'Nine dated events from 410 to 480, each with sources, date precision and caveats.',
    status: 'available',
  },
  {
    id: 'decisions',
    title: 'Five strategic decisions',
    description: 'Fiscal policy, border defence, North Africa, legitimacy and the final crisis of 475–476.',
    status: 'planned',
    plannedPhase: 2,
  },
  {
    id: 'endings',
    title: 'Three distinct endings',
    description: 'Imperial continuity, negotiated transformation or fragmentation — each explained by the choices that led there.',
    status: 'planned',
    plannedPhase: 2,
  },
  {
    id: 'map',
    title: 'Interactive historical map',
    description: 'Pan and zoom across sourced or clearly labelled schematic snapshots, with uncertain borders marked as such.',
    status: 'planned',
    plannedPhase: 3,
  },
  {
    id: 'comparison',
    title: 'Side-by-side comparison',
    description: 'Real and alternate history synchronised to the same year.',
    status: 'planned',
    plannedPhase: 4,
  },
  {
    id: 'creator',
    title: 'Creator Mode',
    description: 'Clean playback with 9:16 and 16:9 safe frames for recording Tales of the Past videos.',
    status: 'planned',
    plannedPhase: 5,
  },
];
