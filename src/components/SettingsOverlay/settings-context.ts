import { createContext, useContext } from 'react';

/**
 * INTERNAL to SettingsOverlay (R5 — not exported from index.ts). Holds the
 * active section id so the nav and the content area stay in sync without prop
 * drilling. Keeps SettingsOverlay props down to {open,onClose} (R3 — avoids the
 * 18-prop pattern of LibraryOverlay).
 */
export interface SettingsContextValue {
  activeId: string;
  setActiveId: (id: string) => void;
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);

export function useSettingsContext(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettingsContext must be used within <SettingsOverlay>');
  }
  return ctx;
}
