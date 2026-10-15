import { useEffect, useSyncExternalStore } from 'react';
import { resolveReducedMotion, type Settings } from './settings';
import { getSettings, subscribeSettings } from './settingsStore';

export function useSettings(): Settings {
  return useSyncExternalStore(subscribeSettings, getSettings, getSettings);
}

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function getSystemReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(REDUCED_MOTION_QUERY).matches
    : false;
}

function subscribeSystemReducedMotion(callback: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
}

export function useSystemReducedMotion(): boolean {
  return useSyncExternalStore(subscribeSystemReducedMotion, getSystemReducedMotion, () => false);
}

/** Whether motion should be reduced right now (user choice combined with the OS setting). */
export function useReducedMotion(): boolean {
  const { motion } = useSettings();
  const system = useSystemReducedMotion();
  return resolveReducedMotion(motion, system);
}

/** Mirrors settings onto <html> data attributes so CSS can respond without prop drilling. */
export function useApplySettingsToDocument(): void {
  const settings = useSettings();
  const reduced = useReducedMotion();
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.motion = reduced ? 'reduced' : 'full';
    root.dataset.ambient = settings.ambientAnimations ? 'on' : 'off';
    root.dataset.textSize = settings.textSize;
  }, [reduced, settings.ambientAnimations, settings.textSize]);
}
