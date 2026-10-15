import { describe, expect, it } from 'vitest';
import { formatHistoricalDate, formatPeriod, formatYear, precisionLabel, toRomanNumeral } from '../../src/lib/dates';

describe('formatYear', () => {
  it('appends the chosen era notation', () => {
    expect(formatYear(476, 'AD')).toBe('476 AD');
    expect(formatYear(476, 'CE')).toBe('476 CE');
  });

  it('rejects years the app does not support', () => {
    expect(() => formatYear(0, 'AD')).toThrow(RangeError);
    expect(() => formatYear(45.5, 'AD')).toThrow(RangeError);
  });
});

describe('formatHistoricalDate', () => {
  it('never shows more precision than the data has', () => {
    expect(formatHistoricalDate({ year: 410, month: 8, day: 24, precision: 'day' }, 'AD')).toBe('24 August 410 AD');
    expect(formatHistoricalDate({ year: 455, month: 6, precision: 'month' }, 'AD')).toBe('June 455 AD');
    expect(formatHistoricalDate({ year: 468, month: 6, day: 1, precision: 'year' }, 'CE')).toBe('468 CE');
    expect(formatHistoricalDate({ year: 451, month: 6, precision: 'approximate' }, 'AD')).toBe('c. 451 AD');
  });

  it('falls back to the year when day precision lacks parts', () => {
    expect(formatHistoricalDate({ year: 476, precision: 'day' }, 'AD')).toBe('476 AD');
  });

  it('labels every precision', () => {
    expect(precisionLabel('approximate')).toBe('Approximate date');
  });
});

describe('formatPeriod', () => {
  it('formats ranges and single years', () => {
    expect(formatPeriod({ startYear: 455, endYear: 476, approximate: true }, 'AD')).toBe('c. 455–476 AD');
    expect(formatPeriod({ startYear: 1815, endYear: 1815, approximate: false }, 'CE')).toBe('1815 CE');
  });
});

describe('toRomanNumeral', () => {
  it('converts campaign key years', () => {
    expect(toRomanNumeral(476)).toBe('CDLXXVI');
    expect(toRomanNumeral(865)).toBe('DCCCLXV');
    expect(toRomanNumeral(1815)).toBe('MDCCCXV');
    expect(toRomanNumeral(4)).toBe('IV');
  });

  it('rejects out-of-range values', () => {
    expect(() => toRomanNumeral(0)).toThrow(RangeError);
    expect(() => toRomanNumeral(4000)).toThrow(RangeError);
  });
});
