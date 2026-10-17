import { formatYear, type EraNotation } from '../../lib/dates';
import type { WorkspaceMode } from '../../types/simulation';

type MapPlaceholderProps = {
  year: number;
  era: EraNotation;
  mode: WorkspaceMode;
  /** Overrides the label above the year. */
  positionLabel?: string;
};

/**
 * Reserved space for the Phase 3 map. Deliberately not a picture of a map: an
 * image here would imply geography the project has not yet sourced.
 */
export function MapPlaceholder({ year, era, mode, positionLabel }: MapPlaceholderProps) {
  return (
    <section
      aria-labelledby="map-placeholder-title"
      className="relative flex h-full min-h-64 flex-col justify-between border border-dashed border-rule/60 bg-night/60 p-5 sm:p-6"
    >
      <div>
        <p className="font-sans text-xs font-semibold text-gold">Coming in a later version</p>
        <h2 id="map-placeholder-title" className="mt-1 text-xl text-parchment">
          Interactive map not built yet
        </h2>
        <p className="mt-2 max-w-md text-[0.9375rem] text-parchment-muted">
          This area will hold the historical map: sourced or clearly labelled schematic snapshots, with uncertain
          borders marked as uncertain. Until then, the timeline and the decisions carry the story.
        </p>
      </div>

      <p className="my-6 text-center">
        <span className="block font-sans text-xs text-parchment-muted">
          {positionLabel ?? (mode === 'real' ? 'Timeline position' : 'Real-history position (comparison not built)')}
        </span>
        <span className="inscription text-[clamp(2.5rem,7vw,4.5rem)] text-parchment">{formatYear(year, era)}</span>
      </p>

    </section>
  );
}
