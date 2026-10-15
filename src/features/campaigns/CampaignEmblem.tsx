import { toRomanNumeral } from '../../lib/dates';

/**
 * Visual treatment for a campaign: its key year as an inscribed Roman numeral.
 * Generated from data, so new campaigns get an emblem without new artwork.
 */
export function CampaignEmblem({ year, muted = false }: { year: number; muted?: boolean }) {
  const numeral = toRomanNumeral(year);
  return (
    <div
      aria-hidden="true"
      className={`flex aspect-[16/7] w-full items-center justify-center overflow-hidden border-b ${
        muted ? 'border-rule-soft text-parchment-muted/45' : 'border-rule/60 text-gold'
      }`}
    >
      <span
        className="inscription px-4 text-center"
        style={{ fontSize: `clamp(1.75rem, ${Math.max(3, 15 - numeral.length)}vw, ${Math.max(2.25, 6 - numeral.length * 0.4)}rem)` }}
      >
        {numeral}
      </span>
    </div>
  );
}
