import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { BetaNotice } from '../components/layout/BetaNotice';
import { SiteFooter } from '../components/layout/SiteFooter';
import { SiteHeader } from '../components/layout/SiteHeader';
import { SettingsDialog } from '../features/settings/SettingsDialog';
import { SettingsDialogContext } from '../features/settings/SettingsDialogContext';
import { useApplySettingsToDocument } from '../features/settings/useSettings';

export function AppLayout() {
  useApplySettingsToDocument();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const open = useCallback(() => setSettingsOpen(true), []);
  const close = useCallback(() => setSettingsOpen(false), []);
  const controls = useMemo(() => ({ open }), [open]);

  const mainRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const firstRender = useRef(true);

  // On navigation: scroll to top and move focus to the new page's content so
  // keyboard and screen-reader users land at the start of what changed.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (location.hash) return;
    if (typeof window.scrollTo === 'function') window.scrollTo({ top: 0 });
    mainRef.current?.focus({ preventScroll: true });
  }, [location.pathname, location.hash]);

  return (
    <SettingsDialogContext.Provider value={controls}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className="flex min-h-dvh flex-col">
        <BetaNotice />
        <SiteHeader />
        <main id="main-content" ref={mainRef} tabIndex={-1} className="flex-1 outline-none">
          <Outlet />
        </main>
        <SiteFooter />
      </div>
      <SettingsDialog open={settingsOpen} onClose={close} />
    </SettingsDialogContext.Provider>
  );
}
