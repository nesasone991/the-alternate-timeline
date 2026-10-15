import { createContext, useContext } from 'react';

export type SettingsDialogControls = {
  readonly open: () => void;
};

export const SettingsDialogContext = createContext<SettingsDialogControls | null>(null);

export function useSettingsDialog(): SettingsDialogControls {
  const value = useContext(SettingsDialogContext);
  if (!value) throw new Error('useSettingsDialog must be used inside <AppLayout>.');
  return value;
}
