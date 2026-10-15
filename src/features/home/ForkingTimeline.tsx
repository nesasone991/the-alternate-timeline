import { cssVars } from '../../lib/cssVars';
import type { HistoricalEvent } from '../../types/history';

type ForkingTimelineProps = {
  /** Events to tick on the real-history line. */
  events: readonly HistoricalEvent[];
  /** Year where the alternate branch leaves the real line. */
  forkYear: number;
  /** Years shown at the ends of the axis. */
  fromYear: number;
  toYear: number;
  /** Years labelled on the compact (phone) variant. */
  compactYears: readonly number[];
};

/**
 * The hero diagram: a single line of recorded history with a dashed fictional
 * branch splitting off at the decision point. A diagram of the idea, not a map.
 */
export function ForkingTimeline({ events, forkYear, fromYear, toYear, compactYears }: ForkingTimelineProps) {
  const description = `Diagram: the recorded timeline from ${fromYear} to ${toYear}, with a fictional alternate branch splitting off in ${forkYear}.`;
  const uniqueYears = [...new Set(events.map((event) => event.date.year))];
  // Every event gets a tick; labels are dropped where they would collide (e.g. 475 beside 476).
  const labelled = new Set<number>();
  let lastLabelled = -Infinity;
  for (const year of [...uniqueYears].reverse()) {
    if (lastLabelled - year >= 4) {
      labelled.add(year);
      lastLabelled = year;
    } else if (lastLabelled === -Infinity) {
      labelled.add(year);
      lastLabelled = year;
    }
  }

  return (
    <figure className="m-0">
      <WideVariant
        years={uniqueYears}
        labelledYears={labelled}
        forkYear={forkYear}
        fromYear={fromYear}
        toYear={toYear}
        description={description}
      />
      <CompactVariant
        years={compactYears}
        forkYear={forkYear}
        fromYear={fromYear}
        toYear={toYear}
        description={description}
      />
    </figure>
  );
}

type VariantProps = {
  years: readonly number[];
  labelledYears?: ReadonlySet<number>;
  forkYear: number;
  fromYear: number;
  toYear: number;
  description: string;
};

function WideVariant({ years, labelledYears, forkYear, fromYear, toYear, description }: VariantProps) {
  const left = 40;
  const right = 960;
  const baseline = 168;
  const x = (year: number) => left + ((year - fromYear) / (toYear - fromYear)) * (right - left);
  const forkX = x(forkYear);
  const branch = `M ${forkX} ${baseline} C ${forkX + 140} ${baseline}, ${forkX + 200} 64, ${right} 56`;

  return (
    <svg viewBox="0 0 1000 230" className="hidden h-auto w-full md:block" role="img" aria-label={description}>
      <line
        x1={left}
        y1={baseline}
        x2={right}
        y2={baseline}
        stroke="#C6A66A"
        strokeWidth="2"
        className="draw-line"
        style={cssVars({ '--line-length': '920', '--draw-duration': '1.8s' })}
      />
      <path
        d={branch}
        fill="none"
        stroke="#D08E95"
        strokeWidth="2"
        strokeDasharray="7 7"
        className="fade-late"
        style={cssVars({ '--draw-delay': '1.1s' })}
      />
      {years.map((year) => {
        const isFork = year === forkYear;
        return (
          <g key={year}>
            <line
              x1={x(year)}
              x2={x(year)}
              y1={baseline - (isFork ? 10 : 6)}
              y2={baseline + (isFork ? 10 : 6)}
              stroke="#E8DCC4"
              strokeOpacity={isFork ? 1 : 0.7}
              strokeWidth={isFork ? 2 : 1.25}
            />
            {labelledYears?.has(year) ?? true ? (
            <text
              x={x(year)}
              y={baseline + 34}
              textAnchor="middle"
              fill="#B8AD97"
              fontSize="17"
              className="font-serif"
            >
              {year}
            </text>
            ) : null}
          </g>
        );
      })}
      <circle cx={forkX} cy={baseline} r="6" fill="#E8DCC4" />
      <text
        x={right}
        y={baseline - 14}
        textAnchor="end"
        fill="#C6A66A"
        fontSize="16"
        className="font-sans"
        letterSpacing="0.06em"
      >
        What happened
      </text>
      <text
        x={right}
        y={40}
        textAnchor="end"
        fill="#D08E95"
        fontSize="16"
        letterSpacing="0.06em"
        className="fade-late font-sans"
        style={cssVars({ '--draw-delay': '1.5s' })}
      >
        What might have happened (fiction)
      </text>
    </svg>
  );
}

function CompactVariant({ years, forkYear, fromYear, toYear, description }: VariantProps) {
  const left = 16;
  const right = 384;
  const baseline = 150;
  const x = (year: number) => left + ((year - fromYear) / (toYear - fromYear)) * (right - left);
  const forkX = x(forkYear);
  const branch = `M ${forkX} ${baseline} C ${forkX + 70} ${baseline}, ${forkX + 100} 70, ${right} 62`;

  return (
    <svg viewBox="0 0 400 200" className="block h-auto w-full md:hidden" role="img" aria-label={description}>
      <line
        x1={left}
        y1={baseline}
        x2={right}
        y2={baseline}
        stroke="#C6A66A"
        strokeWidth="2.5"
        className="draw-line"
        style={cssVars({ '--line-length': '368' })}
      />
      <path
        d={branch}
        fill="none"
        stroke="#D08E95"
        strokeWidth="2.5"
        strokeDasharray="7 7"
        className="fade-late"
      />
      {years.map((year) => (
        <g key={year}>
          <line x1={x(year)} x2={x(year)} y1={baseline - 7} y2={baseline + 7} stroke="#E8DCC4" strokeWidth="1.5" />
          <text x={x(year)} y={baseline + 32} textAnchor="middle" fill="#B8AD97" fontSize="18" className="font-serif">
            {year}
          </text>
        </g>
      ))}
      <circle cx={forkX} cy={baseline} r="6" fill="#E8DCC4" />
      <text x={left} y={baseline - 14} textAnchor="start" fill="#C6A66A" fontSize="15" className="font-sans">
        What happened
      </text>
      <text x={right} y={44} textAnchor="end" fill="#D08E95" fontSize="15" className="fade-late font-sans">
        What might have (fiction)
      </text>
    </svg>
  );
}
