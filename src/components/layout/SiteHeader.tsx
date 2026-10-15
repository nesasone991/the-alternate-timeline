import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { useSettingsDialog } from '../../features/settings/SettingsDialogContext';
import { Icon } from '../ui/Icon';
import { BrandMark } from './BrandMark';

const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/explore', label: 'Explore History', end: false },
  { to: '/how-it-works', label: 'How It Works', end: false },
  { to: '/about', label: 'About', end: false },
] as const;

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex min-h-11 items-center border-b px-1 font-sans text-[0.9375rem] no-underline transition-colors ${
    isActive
      ? 'border-gold text-parchment'
      : 'border-transparent text-parchment-muted hover:text-parchment'
  }`;

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const settingsDialog = useSettingsDialog();

  // Close the mobile menu after navigating.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-rule-soft bg-ink/95 backdrop-blur-sm">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 no-underline" aria-label="The Alternate Timeline — home">
          <BrandMark />
          <span className="inscription text-[0.8125rem] leading-tight tracking-[0.18em] text-parchment">
            The Alternate
            <br />
            Timeline
          </span>
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-6">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end} className={navLinkClass}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-quiet hidden lg:inline-flex"
            onClick={settingsDialog.open}
          >
            <Icon name="settings" size={18} />
            Settings
          </button>
          <button
            type="button"
            className="icon-btn lg:hidden"
            onClick={settingsDialog.open}
            aria-label="Settings"
          >
            <Icon name="settings" />
          </button>
          <button
            type="button"
            className="icon-btn lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} />
          </button>
        </div>
      </div>

      <nav
        id="mobile-menu"
        aria-label="Main"
        hidden={!menuOpen}
        className="border-t border-rule-soft bg-ink lg:hidden"
      >
        <ul className="container-page py-2">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.end} className={(state) => `${navLinkClass(state)} w-full`}>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
