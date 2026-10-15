import type { CSSProperties } from 'react';

/** Typed helper for setting CSS custom properties through the style prop. */
export function cssVars(vars: Record<`--${string}`, string>): CSSProperties {
  return vars as unknown as CSSProperties;
}
