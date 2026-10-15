import type { AlternateScenario, SimulationState } from '../../types/simulation';
import { replay } from './engine';

/**
 * Versioned local saves.
 *
 * A save stores only WHICH choices were made, never resources or flags. Loading
 * replays those choices through the engine, so every restored state is one the
 * rules can actually produce: a hand-edited save cannot grant resources, and a
 * save whose choices no longer fit the campaign is rejected rather than loaded.
 */

export const SAVE_FORMAT = 'the-alternate-timeline/save';
export const SAVE_FORMAT_VERSION = 1;
const MAX_SAVE_BYTES = 16 * 1024;
const MAX_CHOICES = 32;
const CHOICE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type SaveFile = {
  readonly format: typeof SAVE_FORMAT;
  readonly formatVersion: number;
  readonly scenarioId: string;
  readonly scenarioVersion: number;
  readonly savedAt: string;
  readonly choices: readonly string[];
};

export type LoadResult =
  | { readonly status: 'empty' }
  | { readonly status: 'restored'; readonly state: SimulationState; readonly savedAt: string }
  | { readonly status: 'incompatible'; readonly reason: string }
  | { readonly status: 'corrupt'; readonly reason: string };

export function saveKey(scenarioId: string): string {
  return `tat.save.${scenarioId}`;
}

export function serializeSave(scenario: AlternateScenario, state: SimulationState, now: Date): string {
  const file: SaveFile = {
    format: SAVE_FORMAT,
    formatVersion: SAVE_FORMAT_VERSION,
    scenarioId: scenario.id,
    scenarioVersion: scenario.version,
    savedAt: now.toISOString(),
    choices: [...state.choicesMade],
  };
  return JSON.stringify(file);
}

function own(record: Record<string, unknown>, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(record, key) ? record[key] : undefined;
}

/** Validates and replays a stored save. Never throws. */
export function parseSave(scenario: AlternateScenario, raw: string | null | undefined): LoadResult {
  if (raw === null || raw === undefined || raw === '') return { status: 'empty' };
  if (raw.length > MAX_SAVE_BYTES) return { status: 'corrupt', reason: 'The saved game is larger than any real save.' };

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { status: 'corrupt', reason: 'The saved game is damaged and cannot be read.' };
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return { status: 'corrupt', reason: 'The saved game is damaged and cannot be read.' };
  }
  const record = data as Record<string, unknown>;

  if (own(record, 'format') !== SAVE_FORMAT) {
    return { status: 'corrupt', reason: 'The stored data is not a saved game from this site.' };
  }
  if (own(record, 'formatVersion') !== SAVE_FORMAT_VERSION) {
    return { status: 'incompatible', reason: 'The saved game uses a save format this version cannot read.' };
  }
  if (own(record, 'scenarioId') !== scenario.id) {
    return { status: 'incompatible', reason: 'The saved game belongs to a different campaign.' };
  }
  const savedVersion = own(record, 'scenarioVersion');
  if (savedVersion !== scenario.version) {
    return { status: 'incompatible', reason: versionMismatchReason(scenario, savedVersion) };
  }

  const choices = own(record, 'choices');
  if (
    !Array.isArray(choices) ||
    choices.length > MAX_CHOICES ||
    !choices.every((item) => typeof item === 'string' && item.length <= 64 && CHOICE_ID.test(item))
  ) {
    return { status: 'corrupt', reason: 'The saved game’s list of decisions is damaged.' };
  }

  let state: SimulationState;
  try {
    state = replay(scenario, choices as string[]);
  } catch {
    return { status: 'corrupt', reason: 'The saved game contains a decision that is not valid in this campaign.' };
  }

  const savedAt = own(record, 'savedAt');
  return {
    status: 'restored',
    state,
    savedAt: typeof savedAt === 'string' && !Number.isNaN(Date.parse(savedAt)) ? savedAt : '',
  };
}

/**
 * Plain-language explanation for a save from another campaign version, built
 * from the scenario's change notes so it stays accurate as content changes.
 */
export function versionMismatchReason(scenario: AlternateScenario, savedVersion: unknown): string {
  if (typeof savedVersion !== 'number' || !Number.isInteger(savedVersion)) {
    return 'The saved game does not say which version of the campaign it was made with, so it cannot be replayed safely.';
  }
  if (savedVersion > scenario.version) {
    return `The saved game was made with version ${savedVersion} of this campaign, which is newer than this site's version ${scenario.version}. Reload the page to get the latest version.`;
  }
  const since = scenario.changes
    .filter((change) => change.version > savedVersion)
    .map((change) => `Version ${change.version}: ${change.summary}`)
    .join(' ');
  return `The saved game was made with an earlier version of this campaign (version ${savedVersion}; this is version ${scenario.version}). The decisions have changed since then, so your earlier choices cannot be replayed exactly. ${since}`.trim();
}

function storage(): Storage | undefined {
  try {
    return typeof window !== 'undefined' ? window.localStorage : undefined;
  } catch {
    return undefined;
  }
}

export function loadSave(scenario: AlternateScenario): LoadResult {
  try {
    return parseSave(scenario, storage()?.getItem(saveKey(scenario.id)));
  } catch {
    return { status: 'empty' };
  }
}

/** Returns false when the browser blocks storage; the game keeps working without saving. */
export function writeSave(scenario: AlternateScenario, state: SimulationState, now = new Date()): boolean {
  try {
    const target = storage();
    if (!target) return false;
    target.setItem(saveKey(scenario.id), serializeSave(scenario, state, now));
    return true;
  } catch {
    return false;
  }
}

export function clearSave(scenario: AlternateScenario): boolean {
  try {
    storage()?.removeItem(saveKey(scenario.id));
    return true;
  } catch {
    return false;
  }
}
