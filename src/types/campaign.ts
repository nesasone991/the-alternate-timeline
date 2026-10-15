/**
 * Campaign catalog contracts. A campaign is the unit a player picks from the
 * explorer; every campaign-specific screen reads from these records instead of
 * hard-coding titles or dates in components.
 */

/**
 * - `preview`: selectable; some features are built, gameplay is still in development.
 * - `playable`: gameplay complete and reviewed (no campaign has reached this yet).
 * - `coming-soon`: concept only; not selectable.
 */
export type CampaignStatus = 'preview' | 'playable' | 'coming-soon';

export type CampaignPeriod = {
  readonly startYear: number;
  readonly endYear: number;
  /** True when the start date is a convention rather than a precise boundary (shown as "c."). */
  readonly approximate: boolean;
};

export type CampaignSummary = {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  /** The year the campaign is known by, used for the explorer's numeral emblem. */
  readonly keyYear: number;
  readonly period: CampaignPeriod;
  readonly description: string;
  readonly status: CampaignStatus;
  readonly difficulty?: string;
  readonly estimatedPlayTime?: string;
  /** Shown on every card and overview: counterfactual outcomes are speculative. */
  readonly disclaimer: string;
};

export type FeatureStatus = 'available' | 'preview' | 'planned';

export type CampaignFeature = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly status: FeatureStatus;
  /** Development phase in which a planned feature is scheduled. */
  readonly plannedPhase?: number;
};
