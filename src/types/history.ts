/**
 * Historical data contracts.
 *
 * Actual-history data is immutable reference material. Simulation code must never
 * write to it; alternate-history content lives in separate, authored datasets.
 */

export type DatePrecision = 'day' | 'month' | 'year' | 'approximate';

export type HistoricalDate = {
  readonly year: number;
  readonly month?: number;
  readonly day?: number;
  readonly precision: DatePrecision;
};

/** How firmly the event (or its framing) is established in the sources used. */
export type Certainty = 'well-attested' | 'contested' | 'approximate';

export type Source = {
  readonly id: string;
  readonly title: string;
  readonly author?: string;
  readonly publisher?: string;
  readonly url?: string;
  /** Human-readable citation shown in the interface. */
  readonly citation: string;
  /** ISO date the online source was last checked. */
  readonly accessedAt?: string;
  /** Tertiary sources are acceptable for drafts but must be replaced or corroborated before release. */
  readonly kind: 'primary' | 'scholarly' | 'reference' | 'tertiary';
  readonly licenseNotes?: string;
};

export type HistoricalEvent = {
  readonly id: string;
  readonly date: HistoricalDate;
  readonly title: string;
  readonly summary: string;
  readonly sourceIds: readonly string[];
  readonly certainty: Certainty;
  /** Historiographical caveat: disputed dates, contested significance, unreliable figures. */
  readonly caveat?: string;
  /** Whether this event is background context or falls inside the playable window. */
  readonly role: 'context' | 'playable-window' | 'anchor';
  /** Reserved for Phase 3: the sourced or schematic map snapshot that illustrates this event. */
  readonly mapSnapshotId?: string;
};

export type Timeline = {
  readonly id: string;
  readonly startYear: number;
  readonly endYear: number;
  readonly events: readonly HistoricalEvent[];
};
