import type { EndingCategory } from '../../types/simulation';
import { ENDING_THEMES } from './endingThemes';

const R = 92;
const C = 110;

function arc(startDeg: number, endDeg: number, radius = R, cx = C, cy = C): string {
  const toXY = (deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)] as const;
  };
  const [x1, y1] = toXY(startDeg);
  const [x2, y2] = toXY(endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

/** Leaves along the ring for the laurel. */
function leaves(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const deg = (360 / count) * i;
    const rad = ((deg - 90) * Math.PI) / 180;
    const x = C + (R + 9) * Math.cos(rad);
    const y = C + (R + 9) * Math.sin(rad);
    return { x, y, rotate: deg + 35 };
  });
}

/**
 * The ending's emblem: one bold image per category. It draws itself once when
 * motion is enabled (see `.seal-draw` in index.css) and is static otherwise.
 */
export function EndingSeal({ category, numeral }: { category: EndingCategory; numeral: string }) {
  const theme = ENDING_THEMES[category];
  const segments =
    category === 'imperial-survival'
      ? [{ d: arc(0, 359.9), transform: '' }]
      : category === 'fragmented-survival'
        ? [0, 1, 2, 3, 4].map((i) => ({ d: arc(i * 72 + 6, i * 72 + 66), transform: '' }))
        : // Collapse: the same five arcs, each pushed outward along its own direction and turned a little.
          [
            { from: 8, to: 58, push: 26, turn: -18 },
            { from: 80, to: 128, push: 40, turn: 16 },
            { from: 152, to: 200, push: 20, turn: -14 },
            { from: 226, to: 270, push: 36, turn: 20 },
            { from: 296, to: 346, push: 30, turn: -16 },
          ].map(({ from, to, push, turn }) => {
            const mid = (((from + to) / 2 - 90) * Math.PI) / 180;
            const mx = C + R * Math.cos(mid);
            const my = C + R * Math.sin(mid);
            const dx = push * Math.cos(mid);
            const dy = push * Math.sin(mid);
            return {
              d: arc(from, to),
              transform: `translate(${dx.toFixed(1)} ${dy.toFixed(1)}) rotate(${turn} ${mx.toFixed(1)} ${my.toFixed(1)})`,
            };
          });
  return (
    <svg viewBox="-30 -30 280 280" role="img" aria-label={theme.sealDescription} className="h-auto w-full" data-seal={category}>
      <circle cx={C} cy={C} r={R - 18} fill="none" stroke="var(--color-rule-soft)" strokeWidth="1" />
      {segments.map((segment, i) => (
        <path
          key={i}
          d={segment.d}
          transform={segment.transform || undefined}
          pathLength={1}
          fill="none"
          stroke={theme.accent}
          strokeWidth="7"
          strokeLinecap="round"
          className="seal-draw"
          style={{ ['--draw-delay' as string]: `${0.15 + i * 0.12}s` }}
        />
      ))}
      {category === 'imperial-survival'
        ? leaves(28).map((leaf, i) => (
            <ellipse
              key={i}
              cx={leaf.x}
              cy={leaf.y}
              rx="3"
              ry="7"
              fill={theme.accent}
              opacity="0.75"
              transform={`rotate(${leaf.rotate} ${leaf.x} ${leaf.y})`}
              className="seal-fade"
            />
          ))
        : null}
      <text
        x={C}
        y={C + 12}
        textAnchor="middle"
        fontFamily="var(--font-serif)"
        fontSize="25"
        letterSpacing="2"
        fill="var(--color-parchment)"
        className="seal-fade"
        aria-hidden="true"
      >
        {numeral}
      </text>
    </svg>
  );
}
