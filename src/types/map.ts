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
