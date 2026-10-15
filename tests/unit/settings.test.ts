import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  parseSettings,
  resolveReducedMotion,
  serializeSettings,
} from '../../src/features/settings/settings';

describe('parseSettings', () => {
  it('returns defaults for missing, empty or corrupt storage', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('{not json')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('[1,2,3]')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('"a string"')).toEqual(DEFAULT_SETTINGS);
  });

  it('round-trips valid settings', () => {
    const custom = { ...DEFAULT_SETTINGS, motion: 'reduced' as const, eraNotation: 'CE' as const, soundEffects: true };
    expect(parseSettings(serializeSettings(custom))).toEqual(custom);
  });

  it('keeps valid fields and replaces invalid ones with defaults', () => {
    const parsed = parseSettings(JSON.stringify({ motion: 'sideways', textSize: 'larger', soundEffects: 'yes' }));
    expect(parsed.motion).toBe(DEFAULT_SETTINGS.motion);
    expect(parsed.textSize).toBe('larger');
    expect(parsed.soundEffects).toBe(false);
  });

  it('ignores unknown keys and prototype-pollution payloads', () => {
    const parsed = parseSettings('{"__proto__": {"polluted": true}, "extra": 1, "eraNotation": "CE"}');
    expect(parsed.eraNotation).toBe('CE');
    expect(Object.keys(parsed).sort()).toEqual(Object.keys(DEFAULT_SETTINGS).sort());
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('rejects oversized payloads', () => {
    expect(parseSettings(JSON.stringify({ eraNotation: 'CE', pad: 'x'.repeat(5000) }))).toEqual(DEFAULT_SETTINGS);
  });

  it('defaults sound off, as the blueprint requires', () => {
    expect(DEFAULT_SETTINGS.soundEffects).toBe(false);
  });
});

describe('resolveReducedMotion', () => {
  it('follows the device when set to system', () => {
    expect(resolveReducedMotion('system', true)).toBe(true);
    expect(resolveReducedMotion('system', false)).toBe(false);
  });

  it('lets an explicit choice override the device', () => {
    expect(resolveReducedMotion('reduced', false)).toBe(true);
    expect(resolveReducedMotion('full', true)).toBe(false);
  });
});
