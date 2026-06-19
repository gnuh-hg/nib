import { createContext } from 'react';

export type ThemePref = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeContextValue {
  /** User preference: light | dark | system */
  theme: ThemePref;
  /** Concrete theme currently painted (system resolved to light/dark) */
  resolved: ResolvedTheme;
  setTheme: (next: ThemePref) => void;
  /** Cycle light → dark → system → light (for the demo TopChrome button) */
  cycleTheme: () => void;
}

export const THEME_STORAGE_KEY = 'nib-theme';

export const ThemeContext = createContext<ThemeContextValue | null>(null);
