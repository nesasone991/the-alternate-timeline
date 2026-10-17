import type { EraNotation } from '../../lib/dates';

/**
 * User preferences. Stored only in this browser (localStorage); never sent anywhere.
 * Pure functions here so parsing and migration are unit-testable.
 */

export type MotionPreference = 'system' | 'reduced' | 'full';
export type TextSize = 'standard' | 'large' | 'larger';

export type Settings = {
  readonly version: 1;
  /** No audio ships yet; the preference is stored for when licensed sounds are added. */
  readonly soundEffects: boolean;
  /** Decorative, non-essential animation such as the hero timeline drawing in. */
  readonly ambientAnimations: boolean;
  readonly motion: MotionPreference;
  readonly textSize: TextSize;
  readonly eraNotation: EraNotation;
  /**
   * Whether this browser may send anonymous usage counts (see src/lib/analytics.ts).
   * Has an effect only on builds with analytics configured.
   */
  readonly usageCounts: boolean;
};

export const SETTINGS_STORAGE_KEY = 'tat.settings';
export const SETTINGS_VERSION = 1 as const;

export const DEFAULT_SETTINGS: Settings = {
  version: SETTINGS_VERSION,
  soundEffects: false,
  ambientAnimations: true,
  motion: 'system',
  textSize: 'standard',
  eraNotation: 'AD',
  usageCounts: true,
};

const MOTION_VALUES: readonly MotionPreference[] = ['system', 'reduced', 'full'];
const TEXT_SIZES: readonly TextSize[] = ['standard', 'large', 'larger'];
const ERA_VALUES: readonly EraNotation[] = ['AD', 'CE'];

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function pickBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/**
 * Turns whatever is in storage into valid settings. Unknown keys are ignored,
 * invalid values fall back to defaults, and corrupt JSON yields the defaults.
 * Only own, known properties are read, so a hostile payload cannot pollute prototypes.
 */
export function parseSettings(raw: string | null | undefined): Settings {
  if (!raw) return DEFAULT_SETTINGS;
  if (raw.length > 4096) return DEFAULT_SETTINGS;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return DEFAULT_SETTINGS;
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) return DEFAULT_SETTINGS;
  const record = data as Record<string, unknown>;
  const read = (key: keyof Settings): unknown =>
    Object.prototype.hasOwnProperty.call(record, key) ? record[key] : undefined;

  return {
    version: SETTINGS_VERSION,
    soundEffects: pickBoolean(read('soundEffects'), DEFAULT_SETTINGS.soundEffects),
    ambientAnimations: pickBoolean(read('ambientAnimations'), DEFAULT_SETTINGS.ambientAnimations),
    motion: pick(read('motion'), MOTION_VALUES, DEFAULT_SETTINGS.motion),
    textSize: pick(read('textSize'), TEXT_SIZES, DEFAULT_SETTINGS.textSize),
    eraNotation: pick(read('eraNotation'), ERA_VALUES, DEFAULT_SETTINGS.eraNotation),
    usageCounts: pickBoolean(read('usageCounts'), DEFAULT_SETTINGS.usageCounts),
  };
}

export function serializeSettings(settings: Settings): string {
  return JSON.stringify(settings);
}

/** Whether motion should be reduced, combining the user's choice with the OS preference. */
export function resolveReducedMotion(preference: MotionPreference, systemPrefersReduced: boolean): boolean {
  if (preference === 'reduced') return true;
  if (preference === 'full') return false;
  return systemPrefersReduced;
}
