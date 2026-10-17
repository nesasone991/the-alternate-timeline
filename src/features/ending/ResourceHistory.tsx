import { useId, useState } from 'react';
import { formatYear, type EraNotation } from '../../lib/dates';
import { RESOURCE_KEYS, RESOURCE_LABELS, type ResourceKey, type Resources } from '../../types/simulation';
import type { ResourcePoint } from '../simulation/storyEvents';
import { signed } from '../simulation/EffectList';
import { useElementWidth } from './useElementWidth';

const HEIGHT = 150;
const PAD = { top: 12, right: 14, bottom: 26, left: 30 };

function describe(key: ResourceKey, points: readonly ResourcePoint[]): string {
  const values = points.map((point) => point.resources[key]);
  const first = values[0]!;
  const last = values[values.length - 1]!;
  return `${RESOURCE_LABELS[key]}: started at ${first}, ended at ${last} out of 100. Lowest ${Math.min(...values)}, highest ${Math.max(...values)}.`;
}

/** One resource across the story. Decisions are filled markers; consequences hollow; lapsed ones faint. */
function ResourceChart({
  resource,
  points,
  selected,
  onSelect,
}: {
  resource: ResourceKey;
  points: readonly ResourcePoint[];
  selected: number;
  onSelect: (index: number) => void;
}) {
  const { ref, width } = useElementWidth<HTMLDivElement>(320);
  const innerW = width - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const step = points.length > 1 ? innerW / (points.length - 1) : innerW;
  const x = (i: number) => PAD.left + i * step;
  const y = (value: number) => PAD.top + innerH - (value / 100) * innerH;
  const line = points.map((point, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(point.resources[resource]).toFixed(1)}`).join(' ');
  const decisionYears = points
    .map((point, i) => ({ point, i }))
    .filter(({ point }) => point.kind === 'decision');
  const current = points[selected]!;

  return (
    <figure className="min-w-0" data-testid={`history-${resource}`}>
      <figcaption className="flex items-baseline justify-between gap-3 font-sans text-sm">
        <span className="font-semibold text-parchment">{RESOURCE_LABELS[resource]}</span>
        <span className="tabular-nums text-parchment-muted">
          {current.resources[resource]} / 100
        </span>
      </figcaption>
      <div ref={ref} className="mt-1">
        <svg width={width} height={HEIGHT} role="img" aria-label={describe(resource, points)} className="block max-w-full">
          {[0, 50, 100].map((tick) => (
            <g key={tick}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(tick)} y2={y(tick)} stroke="var(--color-rule-soft)" strokeWidth="1" />
              <text x={PAD.left - 6} y={y(tick) + 4} textAnchor="end" fontSize="11" fill="var(--color-parchment-muted)" fontFamily="var(--font-sans)">
                {tick}
              </text>
            </g>
          ))}
          {decisionYears.map(({ point, i }) => (
            <text
              key={`year-${i}`}
              x={x(i)}
              y={HEIGHT - 8}
              textAnchor="middle"
              fontSize="11"
              fill="var(--color-parchment-muted)"
              fontFamily="var(--font-sans)"
            >
              {point.year}
            </text>
          ))}
          <line x1={x(selected)} x2={x(selected)} y1={PAD.top} y2={PAD.top + innerH} stroke="var(--color-parchment-muted)" strokeWidth="1" />
          <path d={line} fill="none" stroke="var(--color-gold)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" pathLength={1} className="chart-draw" />
          {points.map((point, i) => {
            const cx = x(i);
            const cy = y(point.resources[resource]);
            const isSelected = i === selected;
            const lapsed = point.kind === 'consequence' && point.triggered === false;
            return (
              <g key={point.sequence}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isSelected ? 6 : 4.5}
                  fill={point.kind === 'consequence' ? 'var(--color-ink)' : 'var(--color-gold)'}
                  stroke={point.kind === 'consequence' ? (lapsed ? 'var(--color-parchment-muted)' : 'var(--color-gold)') : 'var(--color-ink)'}
                  strokeWidth="2"
                  data-step={i}
                  data-kind={point.kind}
                  data-value={point.resources[resource]}
                />
                <rect
                  x={cx - Math.max(step, 24) / 2}
                  y={0}
                  width={Math.max(step, 24)}
                  height={HEIGHT}
                  fill="transparent"
                  onPointerEnter={() => onSelect(i)}
                  onPointerDown={() => onSelect(i)}
                  aria-hidden="true"
                />
              </g>
            );
          })}
        </svg>
      </div>
    </figure>
  );
}

function Delta({ value }: { value: number }) {
  if (value === 0) return <span className="text-parchment-muted">no change</span>;
  return <span className={value < 0 ? 'text-burgundy-bright' : 'text-gold'}>{signed(value)}</span>;
}

/**
 * "Your empire in 476": final values, then how each resource moved through
 * every decision and consequence. All values come from `resourceTimeline`,
 * which copies what the engine recorded; nothing is recalculated here.
 */
export function ResourceHistory({
  points,
  finalResources,
  era,
}: {
  points: readonly ResourcePoint[];
  finalResources: Resources;
  era: EraNotation;
}) {
  const [selected, setSelected] = useState(points.length - 1);
  const sliderId = useId();
  const start = points[0]!.resources;
  const current = points[selected]!;
  const previous = points[Math.max(0, selected - 1)]!;

  return (
    <div>
      <ul className="grid grid-cols-2 gap-px overflow-hidden border border-rule-soft bg-rule-soft lg:grid-cols-4" aria-label="Final resources in 476">
        {RESOURCE_KEYS.map((key) => {
          const change = finalResources[key] - start[key];
          return (
            <li key={key} className="bg-night p-4" data-testid={`final-${key}`}>
              <p className="font-sans text-sm text-parchment-muted">{RESOURCE_LABELS[key]}</p>
              <p className="mt-1 font-sans text-4xl font-semibold tabular-nums text-parchment">
                {finalResources[key]}
                <span className="text-base font-normal text-parchment-muted"> / 100</span>
              </p>
              <p className="mt-1 font-sans text-sm">
                <Delta value={change} /> <span className="text-parchment-muted">
                  since {formatYear(points[0]!.year, era)} (started at {start[key]})
                </span>
              </p>
            </li>
          );
        })}
      </ul>

      <div className="mt-8">
        <h3 className="text-xl text-parchment">How your empire changed</h3>
        <p className="mt-1 max-w-[42rem] font-sans text-sm text-parchment-muted">
          Each point is the state after one of your decisions (filled marker) or a consequence that came due (hollow
          marker; faint when it did not happen). Move the slider, or point at a chart, to see any moment.
        </p>

        <div className="mt-4 border border-rule-soft bg-ink/40 p-4" data-testid="history-readout" aria-live="polite">
          <label htmlFor={sliderId} className="control-label block">
            Moment {selected + 1} of {points.length}
          </label>
          <input
            id={sliderId}
            type="range"
            min={0}
            max={points.length - 1}
            step={1}
            value={selected}
            onChange={(event) => setSelected(Number(event.target.value))}
            className="year-range"
            aria-valuetext={`Moment ${selected + 1} of ${points.length}: ${current.label}`}
          />
          <p className="font-sans text-sm text-parchment-muted">
            {current.kind === 'start' ? 'Start' : `c. ${formatYear(current.year, era)}`}
            {current.kind === 'decision' ? ', your decision' : current.kind === 'consequence' ? ', a consequence' : ''}
          </p>
          <p className="mt-0.5 text-parchment">{current.label}</p>
          <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 font-sans text-sm sm:grid-cols-4">
            {RESOURCE_KEYS.map((key) => (
              <li key={key}>
                <span className="text-parchment-muted">{RESOURCE_LABELS[key]} </span>
                <span className="font-semibold tabular-nums text-parchment">{current.resources[key]}</span>{' '}
                {selected > 0 ? <Delta value={current.resources[key] - previous.resources[key]} /> : null}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 grid gap-x-8 gap-y-6 md:grid-cols-2">
          {RESOURCE_KEYS.map((key) => (
            <ResourceChart key={key} resource={key} points={points} selected={selected} onSelect={setSelected} />
          ))}
        </div>

        <details className="mt-6 border-t border-rule-soft pt-3">
          <summary className="inline-flex min-h-11 cursor-pointer items-center font-sans text-sm text-gold">
            Show every moment as a table
          </summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse font-sans text-sm" data-testid="history-table">
              <caption className="sr-only">Resources after each decision and consequence</caption>
              <thead>
                <tr className="border-b border-rule-soft text-left text-parchment-muted">
                  <th scope="col" className="py-2 pr-3 font-normal">Year</th>
                  <th scope="col" className="py-2 pr-3 font-normal">What happened</th>
                  {RESOURCE_KEYS.map((key) => (
                    <th key={key} scope="col" className="py-2 pr-3 text-right font-normal">
                      {RESOURCE_LABELS[key]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {points.map((point) => (
                  <tr key={point.sequence} className="border-b border-rule-soft/60 align-top">
                    <td className="py-2 pr-3 tabular-nums">{point.year}</td>
                    <th scope="row" className="py-2 pr-3 text-left font-normal">
                      {point.kind === 'decision' ? <span className="font-semibold">{point.label}</span> : point.label}
                    </th>
                    {RESOURCE_KEYS.map((key) => (
                      <td key={key} className="py-2 pr-3 text-right tabular-nums">
                        {point.resources[key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </div>
  );
}
