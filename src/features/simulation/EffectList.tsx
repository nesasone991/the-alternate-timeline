import { RESOURCE_LABELS, type AppliedEffect, type Effect, type StructuralConsequence } from '../../types/simulation';

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
              <span className="text-parchment-muted">
                {effect.requested < 0 && effect.applied > effect.requested
                  ? ` — only ${Math.abs(effect.applied)} of ${Math.abs(effect.requested)} could be paid`
                  : ' capped at the 0–100 limit'}
              </span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Costs that could not be paid in full and what made up for them. Text first,
 * so the meaning never depends on colour.
 */
export function StructuralList({
  items,
  flagLabel,
  projected = false,
}: {
  items: readonly StructuralConsequence[];
  flagLabel: (flag: string) => string;
  projected?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <ul className="mt-2 space-y-2" data-testid={projected ? 'projected-unpaid' : 'unpaid-costs'}>
      {items.map((item) => (
        <li key={`${item.resource}-${item.flag}`} className="border-l-2 border-burgundy-bright pl-3 font-sans text-sm">
          <span className="block font-semibold text-burgundy-bright">
            {projected ? 'Cannot be paid in full: ' : 'Could not be paid in full: '}
            {item.unpaid} {RESOURCE_LABELS[item.resource]}
          </span>
          <span className="block text-parchment">{item.explanation}</span>
          <span className="mt-1 block">
            {RESOURCE_LABELS[item.transfer.resource]} {projected ? 'would fall' : 'fell'} {item.transfer.before} →{' '}
            {item.transfer.after} ({signed(item.transfer.applied)}).{' '}
            <span className="text-parchment-muted">Recorded: {flagLabel(item.flag)}.</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export { signed };
