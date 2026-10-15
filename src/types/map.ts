/**
 * Map contracts (Phase 3). Interfaces only — no map renderer exists yet.
 */

export type MapSnapshot = {
  readonly id: string;
  readonly year: number;
  readonly sourceIds: readonly string[];
  readonly certaintyNotes: string;
  /** Path to a GeoJSON FeatureCollection under public/ or src/data. */
  readonly featureCollectionPath: string;
  /** True when the geometry is an illustrative regional schematic rather than sourced borders. */
  readonly schematic: boolean;
};

/** Distinct kinds of control the map must never merge into one uniform territory. */
export type ControlKind = 'direct-rule' | 'nominal-sovereignty' | 'influence' | 'uncertain';

export type CameraPreset = {
  readonly id: string;
  readonly label: string;
  /** Centre in degrees longitude/latitude. */
  readonly center: readonly [number, number];
  readonly zoom: number;
};

/**
 * Coarse schematic regions used by alternate-history map cues. They name areas,
 * not borders: the Phase 3 renderer decides how (and whether) to draw them, and
 * must label them as illustrative. Never treat these as historical boundaries.
 */
export const SCHEMATIC_REGIONS = [
  'italy',
  'sicily',
  'sardinia-corsica',
  'africa',
  'gaul',
  'hispania',
  'illyricum',
  'constantinople',
] as const;

export type SchematicRegionId = (typeof SCHEMATIC_REGIONS)[number];

/**
 * A hint for a future map animation, authored alongside fictional events.
 * - `emphasis`: highlight the regions.
 * - `movement`: something travels from the first region through the rest, in order.
 * - `pressure`: the regions are under threat or strain.
 */
export type MapCue = {
  readonly kind: 'emphasis' | 'movement' | 'pressure';
  readonly regions: readonly SchematicRegionId[];
  readonly tone: 'gain' | 'loss' | 'neutral' | 'uncertain';
  readonly label: string;
};
