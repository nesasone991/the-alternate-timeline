import { RESOURCE_LABELS, type AppliedEffect, type Effect } from '../../types/simulation';

function signed(value: number): string {
  if (value > 0) return `+${value}`;
  if (value < 0) return `−${Math.abs(value)}`;
  return '±0';
}

/** Compact chips for a choice's authored effects, e.g. "Economy +12". Direction is in the text, not only the colour. */
export function EffectChips({ effects }: { effects: readonly Effect[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Effects">
      {effects.map((effect) => (
        <li
          key={effect.resource}
          className={`inline-flex items-center gap-1 border px-2 py-0.5 font-sans text-xs font-semibold ${
            effect.delta < 0 ? 'border-burgundy-bright/60 text-burgundy-bright' : 'border-gold/60 text-gold'
          }`}
        >
          <span aria-hidden="true">{effect.delta < 0 ? '▼' : '▲'}</span>
          {RESOURCE_LABELS[effect.resource]} {signed(effect.delta)}
        </li>
      ))}
    </ul>
  );
}

/** Before → after for each applied effect, with a note when clamping changed the result. */
export function AppliedEffectList({ effects }: { effects: readonly AppliedEffect[] }) {
  return (
    <ul className="space-y-1 font-sans text-sm">
      {effects.map((effect) => (
        <li key={effect.resource} className="flex flex-wrap items-baseline justify-between gap-x-3">
          <span>{RESOURCE_LABELS[effect.resource]}</span>
          <span className="tabular-nums">
            {effect.before} → <span className="font-semibold text-parchment">{effect.after}</span>{' '}
            <span className={effect.applied < 0 ? 'text-burgundy-bright' : 'text-gold'}>({signed(effect.applied)})</span>
            {effect.applied !== effect.requested ? (
              <span className="text-parchment-muted"> capped at the 0–100 limit</span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

export { signed };
