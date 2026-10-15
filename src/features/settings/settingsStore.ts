import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  parseSettings,
  serializeSettings,
  type Settings,
} from './settings';

/**
 * A tiny external store for settings. React subscribes through
 * useSyncExternalStore (see useSettings.ts). Storage failures — private mode,
 * full quota, blocked storage — never break the app; settings simply stop persisting.
 */

type Listener = () => void;

const listeners = new Set<Listener>();
let current: Settings = DEFAULT_SETTINGS;
let loaded = false;
let persistenceAvailable = true;

function storage(): Storage | undefined {
  try {
    return typeof window !== 'undefined' ? window.localStorage : undefined;
  } catch {
    return undefined;
  }
}

function load(): void {
  if (loaded) return;
  loaded = true;
  try {
    current = parseSettings(storage()?.getItem(SETTINGS_STORAGE_KEY));
  } catch {
    persistenceAvailable = false;
    current = DEFAULT_SETTINGS;
  }
}

function emit(): void {
  for (const listener of listeners) listener();
}

export function getSettings(): Settings {
  load();
  return current;
}

export function isPersistenceAvailable(): boolean {
  load();
  return persistenceAvailable;
}

export function updateSettings(patch: Partial<Omit<Settings, 'version'>>): void {
  load();
  // Re-parse the merged object so every write is validated the same way as a read.
  current = parseSettings(serializeSettings({ ...current, ...patch }));
  try {
    const target = storage();
    if (!target) throw new Error('No storage');
    target.setItem(SETTINGS_STORAGE_KEY, serializeSettings(current));
    persistenceAvailable = true;
  } catch {
    persistenceAvailable = false;
  }
  emit();
}

export function resetSettings(): void {
  load();
  current = DEFAULT_SETTINGS;
  try {
    storage()?.removeItem(SETTINGS_STORAGE_KEY);
  } catch {
    persistenceAvailable = false;
  }
  emit();
}

export function subscribeSettings(listener: Listener): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === SETTINGS_STORAGE_KEY) {
      current = parseSettings(event.newValue);
      listener();
    }
  };
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
  };
}

/** Test helper: forget cached state so the next read comes from storage again. */
export function __resetSettingsStoreForTests(): void {
  loaded = false;
  current = DEFAULT_SETTINGS;
  persistenceAvailable = true;
  listeners.clear();
}
