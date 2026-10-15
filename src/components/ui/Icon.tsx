import type { SVGProps } from 'react';

/**
 * In-repo icon set: a dozen 24×24 stroke icons drawn for this project.
 * Kept local instead of adding an icon dependency; swap for lucide-react later
 * if the set grows large. Icons are decorative by default (aria-hidden) — the
 * control that contains one must carry its own accessible name.
 */
export type IconName =
  | 'menu'
  | 'close'
  | 'settings'
  | 'play'
  | 'pause'
  | 'previous'
  | 'next'
  | 'restart'
  | 'zoom-in'
  | 'zoom-out'
  | 'recenter'
  | 'lock'
  | 'arrow-left'
  | 'external';

const paths: Record<IconName, string> = {
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6L6 18',
  settings:
    'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19.4 13a7.6 7.6 0 0 0 0-2l2-1.5-2-3.4-2.4 1a7.4 7.4 0 0 0-1.7-1L15 3.5h-4l-.4 2.6a7.4 7.4 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.5a7.6 7.6 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a7.4 7.4 0 0 0 1.7 1l.4 2.6h4l.4-2.6a7.4 7.4 0 0 0 1.7-1l2.4 1 2-3.4z',
  play: 'M8 5.5v13l10.5-6.5z',
  pause: 'M8.5 5.5v13M15.5 5.5v13',
  previous: 'M6.5 6v12M18 6l-8.5 6 8.5 6z',
  next: 'M17.5 6v12M6 6l8.5 6L6 18z',
  restart: 'M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4v3.5H8',
  'zoom-in': 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM20 20l-4.8-4.8M10.5 7.5v6M7.5 10.5h6',
  'zoom-out': 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM20 20l-4.8-4.8M7.5 10.5h6',
  recenter: 'M12 4v3M12 17v3M4 12h3M17 12h3M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z',
  'arrow-left': 'M19 12H5M11 6l-6 6 6 6',
  external: 'M14 5h5v5M19 5l-8 8M17 14v5H5V7h5',
};

type IconProps = Omit<SVGProps<SVGSVGElement>, 'name'> & {
  name: IconName;
  size?: number;
};

export function Icon({ name, size = 20, ...rest }: IconProps) {
  const filled = name === 'play' || name === 'previous' || name === 'next';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 1 : 1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={paths[name]} />
    </svg>
  );
}
