import type { HistoricalDate } from '../types/history';

export type EraNotation = 'AD' | 'CE';

/** "c. 455–476 AD", or a single year when the period is one year long. */
export function formatPeriod(
  period: { readonly startYear: number; readonly endYear: number; readonly approximate: boolean },
  era: EraNotation,
): string {
  const prefix = period.approximate ? 'c. ' : '';
  if (period.startYear === period.endYear) return `${prefix}${formatYear(period.startYear, era)}`;
  return `${prefix}${period.startYear}–${period.endYear} ${era}`;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/** "476 AD" or "476 CE". Years before 1 are not used by any current campaign. */
export function formatYear(year: number, era: EraNotation): string {
  if (!Number.isInteger(year) || year < 1) {
    throw new RangeError(`Unsupported year: ${year}`);
  }
  return `${year} ${era}`;
}

export function monthName(month: number): string {
  const name = MONTHS[month - 1];
  if (!name) throw new RangeError(`Invalid month: ${month}`);
  return name;
}

/**
 * Formats a historical date at exactly the precision the sources support —
 * never more. Approximate dates are prefixed with "c.".
 */
export function formatHistoricalDate(date: HistoricalDate, era: EraNotation): string {
  const year = formatYear(date.year, era);
  switch (date.precision) {
    case 'day':
      if (date.month === undefined || date.day === undefined) return year;
      return `${date.day} ${monthName(date.month)} ${year}`;
    case 'month':
      if (date.month === undefined) return year;
      return `${monthName(date.month)} ${year}`;
    case 'year':
      return year;
    case 'approximate':
      return `c. ${year}`;
  }
}

const PRECISION_LABELS: Record<HistoricalDate['precision'], string> = {
  day: 'Exact date',
  month: 'Month known',
  year: 'Year known',
  approximate: 'Approximate date',
};

export function precisionLabel(precision: HistoricalDate['precision']): string {
  return PRECISION_LABELS[precision];
}

/** Roman numerals for the campaign emblems (1–3999). */
export function toRomanNumeral(value: number): string {
  if (!Number.isInteger(value) || value < 1 || value > 3999) {
    throw new RangeError(`Roman numerals support 1–3999, got ${value}`);
  }
  const table: ReadonlyArray<readonly [number, string]> = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let remaining = value;
  let result = '';
  for (const [amount, numeral] of table) {
    while (remaining >= amount) {
      result += numeral;
      remaining -= amount;
    }
  }
  return result;
}
