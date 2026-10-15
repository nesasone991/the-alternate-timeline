import type { Timeline } from '../../../types/history';

/**
 * Actual-history baseline for the Fall of Rome campaign.
 *
 * Immutable reference data: deep-frozen at module load so no gameplay code can
 * alter it. Wording is original summary, not quotation. Status: draft, pending
 * editorial review (see docs/HISTORICAL_REVIEW.md).
 */
const timeline: Timeline = {
  id: 'rome-actual',
  startYear: 410,
  endYear: 480,
  events: [
    {
      id: 'sack-of-rome-410',
      date: { year: 410, month: 8, day: 24, precision: 'day' },
      title: 'Visigoths under Alaric sack Rome',
      summary:
        'Alaric’s Visigothic forces enter Rome and plunder it for three days. The sack shocked contemporaries: Jerome lamented it, and Augustine’s City of God, begun in 413, responds to the questions it raised.',
      sourceIds: ['britannica-sack-410'],
      certainty: 'well-attested',
      role: 'context',
    },
    {
      id: 'vandals-take-carthage-439',
      date: { year: 439, month: 10, day: 19, precision: 'day' },
      title: 'Vandals seize Carthage',
      summary:
        'Gaiseric’s Vandals take Carthage by surprise, ending Roman control of the city and dealing a heavy blow to imperial power. North Africa had been a major source of revenue and grain for the West.',
      sourceIds: ['britannica-gaiseric'],
      certainty: 'well-attested',
      role: 'context',
    },
    {
      id: 'catalaunian-plains-451',
      date: { year: 451, month: 6, precision: 'approximate' },
      title: 'Battle of the Catalaunian Plains',
      summary:
        'A coalition led by the Roman general Aetius, with the Visigoths under Theodoric I, fights Attila’s Hunnic army in Gaul. Attila withdraws, but the battle is usually judged inconclusive.',
      sourceIds: ['wiki-catalaunian-plains'],
      certainty: 'contested',
      caveat:
        'The 20 June date is a modern reconstruction (Bury); other dates have been proposed. Historians disagree on whether the battle was decisive, and ancient casualty figures are not credible.',
      role: 'context',
    },
    {
      id: 'valentinian-assassinated-455',
      date: { year: 455, month: 3, day: 16, precision: 'day' },
      title: 'Emperor Valentinian III is assassinated',
      summary:
        'Valentinian III is murdered in Rome; Petronius Maximus takes the throne the next day. The end of the dynasty of Theodosius in the West opens a period of rapid imperial turnover.',
      sourceIds: ['wiki-sack-455'],
      certainty: 'well-attested',
      role: 'playable-window',
    },
    {
      id: 'vandal-sack-455',
      date: { year: 455, month: 6, precision: 'month' },
      title: 'Vandals sack Rome',
      summary:
        'Gaiseric’s fleet lands in Italy and the Vandals plunder Rome for about two weeks before returning to Africa. Petronius Maximus is killed by a Roman crowd while trying to flee.',
      sourceIds: ['britannica-gaiseric', 'wiki-sack-455'],
      certainty: 'well-attested',
      caveat:
        'How destructive the sack was is debated: some accounts stress restraint after Pope Leo I intervened, others record extensive plunder of public and private buildings.',
      role: 'playable-window',
    },
    {
      id: 'cape-bon-468',
      date: { year: 468, precision: 'year' },
      title: 'Expedition against the Vandals fails at Cape Bon',
      summary:
        'A combined Eastern and Western Roman expedition under Basiliscus sails against Vandal Carthage. A Vandal fireship attack throws the fleet into disorder and the campaign collapses. It was the second major attempt to overthrow Gaiseric, after Majorian’s in 460.',
      sourceIds: ['britannica-gaiseric', 'wiki-cape-bon-468'],
      certainty: 'well-attested',
      caveat:
        'Ancient figures for the fleet, the army and the cost vary widely and are partly emended by modern scholars; no single figure should be treated as precise.',
      role: 'playable-window',
    },
    {
      id: 'orestes-romulus-475',
      date: { year: 475, precision: 'year' },
      title: 'Orestes ousts Julius Nepos and crowns his son',
      summary:
        'The general Orestes turns his army on Emperor Julius Nepos, who flees across the Adriatic to Dalmatia. On 31 October Orestes proclaims his young son Romulus emperor.',
      sourceIds: ['wiki-romulus-augustulus'],
      certainty: 'well-attested',
      role: 'playable-window',
    },
    {
      id: 'odoacer-deposes-romulus-476',
      date: { year: 476, precision: 'year' },
      title: 'Odoacer deposes Romulus Augustulus',
      summary:
        'Odoacer, commander of the army in Italy, defeats and executes Orestes, then deposes Romulus and rules Italy himself while acknowledging the Eastern emperor Zeno. No new Western emperor is proclaimed in Italy.',
      sourceIds: ['britannica-odoacer', 'wiki-romulus-augustulus'],
      certainty: 'well-attested',
      caveat:
        '476 is the conventional end of the Western Roman Empire, not a single moment of collapse: Roman law, administration and identity continued in Italy, and Julius Nepos kept his claim to the Western throne until 480. Sources consulted place the deposition in late August or on 4 September 476.',
      role: 'anchor',
    },
    {
      id: 'nepos-dies-480',
      date: { year: 480, precision: 'year' },
      title: 'Julius Nepos is killed in Dalmatia',
      summary:
        'Nepos, still recognised by Constantinople as Western emperor, is murdered. With him the line of Western emperors ends; some historians count him, not Romulus, as the last.',
      sourceIds: ['wiki-romulus-augustulus'],
      certainty: 'well-attested',
      role: 'context',
    },
  ],
};

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value)) {
      deepFreeze((value as Record<string, unknown>)[key]);
    }
  }
  return value;
}

export const romeActualTimeline: Timeline = deepFreeze(timeline);

/** The Eastern Roman Empire is not part of the timeline range but must always be explained. */
export const easternContinuityNote = {
  text: 'The Roman Empire did not end in 476. Its eastern half, ruled from Constantinople and still calling itself Roman, continued for almost another thousand years, until the city fell to the Ottomans in 1453.',
  sourceIds: ['whe-byzantine-empire'],
} as const;
