import type { Source } from '../../../types/history';

/**
 * Source registry for the Fall of Rome campaign.
 *
 * Every entry was opened and checked on the `accessedAt` date. Tertiary sources
 * (Wikipedia) are used only where they summarise and cite the scholarly debate;
 * each must be corroborated against the scholarly works listed in
 * docs/HISTORICAL_REVIEW.md before public release.
 */
export const romeSources: readonly Source[] = [
  {
    id: 'britannica-sack-410',
    title: 'Sack of Rome (410)',
    publisher: 'Encyclopaedia Britannica',
    url: 'https://www.britannica.com/event/Sack-of-Rome-410',
    citation: 'Encyclopaedia Britannica, "Sack of Rome" (410).',
    accessedAt: '2026-10-15',
    kind: 'reference',
  },
  {
    id: 'britannica-gaiseric',
    title: 'Gaiseric',
    publisher: 'Encyclopaedia Britannica',
    url: 'https://www.britannica.com/biography/Gaiseric',
    citation: 'Encyclopaedia Britannica, "Gaiseric".',
    accessedAt: '2026-10-15',
    kind: 'reference',
  },
  {
    id: 'britannica-odoacer',
    title: 'Odoacer',
    publisher: 'Encyclopaedia Britannica',
    url: 'https://www.britannica.com/biography/Odoacer',
    citation: 'Encyclopaedia Britannica, "Odoacer".',
    accessedAt: '2026-10-15',
    kind: 'reference',
  },
  {
    id: 'wiki-catalaunian-plains',
    title: 'Battle of the Catalaunian Plains',
    publisher: 'Wikipedia',
    url: 'https://en.wikipedia.org/wiki/Battle_of_the_Catalaunian_Plains',
    citation:
      'Wikipedia, "Battle of the Catalaunian Plains" — summarises the dating and significance debate (Bury, Hughes, Kim).',
    accessedAt: '2026-10-15',
    kind: 'tertiary',
    licenseNotes: 'Text CC BY-SA 4.0; facts only are used here, no text is reproduced.',
  },
  {
    id: 'wiki-sack-455',
    title: 'Sack of Rome (455)',
    publisher: 'Wikipedia',
    url: 'https://en.wikipedia.org/wiki/Sack_of_Rome_(455)',
    citation: 'Wikipedia, "Sack of Rome (455)".',
    accessedAt: '2026-10-15',
    kind: 'tertiary',
    licenseNotes: 'Text CC BY-SA 4.0; facts only are used here, no text is reproduced.',
  },
  {
    id: 'wiki-cape-bon-468',
    title: 'Battle of Cape Bon (468)',
    publisher: 'Wikipedia',
    url: 'https://en.wikipedia.org/wiki/Battle_of_Cape_Bon_(468)',
    citation:
      'Wikipedia, "Battle of Cape Bon (468)" — cites Heather (2006), Bury (1923) and Priscus/Procopius in translation.',
    accessedAt: '2026-10-15',
    kind: 'tertiary',
    licenseNotes: 'Text CC BY-SA 4.0; facts only are used here, no text is reproduced.',
  },
  {
    id: 'wiki-romulus-augustulus',
    title: 'Romulus Augustulus',
    publisher: 'Wikipedia',
    url: 'https://en.wikipedia.org/wiki/Romulus_Augustulus',
    citation: 'Wikipedia, "Romulus Augustulus".',
    accessedAt: '2026-10-15',
    kind: 'tertiary',
    licenseNotes: 'Text CC BY-SA 4.0; facts only are used here, no text is reproduced.',
  },
  {
    id: 'whe-byzantine-empire',
    title: 'Byzantine Empire',
    author: 'Mark Cartwright',
    publisher: 'World History Encyclopedia',
    url: 'https://www.worldhistory.org/Byzantine_Empire/',
    citation: 'Cartwright, M., "Byzantine Empire", World History Encyclopedia.',
    accessedAt: '2026-10-15',
    kind: 'reference',
  },
];
