import { createContext } from 'react';
import en from '@/locales/en.json';

export type Lang = 'en' | 'vi';

/** Canonical key set derived from en.json so t() is type-checked. */
export type I18nKey = keyof typeof en;

export type TParams = Record<string, string | number>;

export interface I18nContextValue {
  lang: Lang;
  setLang: (next: Lang) => void;
  toggleLang: () => void;
  /** Translate a key with optional {{param}} interpolation. */
  t: (key: I18nKey, params?: TParams) => string;
}

export const LANG_STORAGE_KEY = 'nib-lang';

export const I18nContext = createContext<I18nContextValue | null>(null);
