import type { EndingCategory } from '../../types/simulation';

/**
 * Presentation for each ending category: its visual identity and the short,
 * campaign-independent line that sets the atmosphere. The campaign-specific
 * narrative always comes from the ending report, never from here.
 */
export type EndingTheme = {
  readonly category: EndingCategory;
  /** Short line above the headline, in sentence case. */
  readonly atmosphere: string;
  /** One-sentence framing that opens the introduction. */
  readonly introduction: string;
  /** CSS colour for the seal, rules and markers (never body text). */
  readonly accent: string;
  /** Soft background wash behind the hero. */
  readonly wash: string;
  /** Accessible description of the seal artwork. */
  readonly sealDescription: string;
};

export const ENDING_THEMES: Readonly<Record<EndingCategory, EndingTheme>> = {
  'imperial-survival': {
    category: 'imperial-survival',
    atmosphere: 'The throne held.',
    introduction: 'Against the pressures that ended the Western Empire in recorded history, your council kept an emperor on the throne of Italy.',
    accent: 'var(--color-gold-bright)',
    wash: 'radial-gradient(ellipse at 70% 30%, rgb(198 166 106 / 0.22), transparent 60%)',
    sealDescription: 'An unbroken laurel ring: the imperial office came through whole.',
  },
  'fragmented-survival': {
    category: 'fragmented-survival',
    atmosphere: 'Rome endured, divided.',
    introduction: 'Your council did not save the empire whole, but a Roman order outlived the crisis in pieces held together by bargains, soldiers and successors.',
    accent: 'var(--color-rule)',
    wash: 'radial-gradient(ellipse at 70% 30%, rgb(139 115 85 / 0.28), transparent 60%)',
    sealDescription: 'A ring broken into five separate arcs: the empire survived in parts.',
  },
  'imperial-collapse': {
    category: 'imperial-collapse',
    atmosphere: 'The centre gave way.',
    introduction: 'Your council could not hold the West together. By 476 no emperor and no successor order commanded it.',
    accent: 'var(--color-burgundy-bright)',
    wash: 'radial-gradient(ellipse at 70% 30%, rgb(113 61 67 / 0.45), transparent 62%)',
    sealDescription: 'The arcs of a ring scattered and out of place: the imperial order came apart.',
  },
};
