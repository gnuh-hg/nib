import { useCallback, useMemo, useState } from 'react';
import en from '@/locales/en.json';
import vi from '@/locales/vi.json';
import {
  I18nContext,
  LANG_STORAGE_KEY,
  type I18nKey,
  type Lang,
  type TParams,
} from './i18n-context';

// Static maps — switching is runtime (no reload) and avoids async flash.
// en.json is the canonical key set; vi.json must mirror it (see tests/lint).
const LOCALES: Record<Lang, Record<string, string>> = { en, vi };

function detectInitialLang(): Lang {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored === 'en' || stored === 'vi') return stored;
  } catch {
    /* ignore */
  }
  const nav =
    typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : 'en';
  return nav.startsWith('vi') ? 'vi' : 'en';
}

function interpolate(template: string, params?: TParams): string {
  if (!params) return template;
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name: string) => {
    const v = params[name];
    return v === undefined ? match : String(v);
  });
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => detectInitialLang());

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next: Lang = prev === 'en' ? 'vi' : 'en';
      try {
        localStorage.setItem(LANG_STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const t = useCallback(
    (key: I18nKey, params?: TParams): string => {
      const dict = LOCALES[lang];
      const fallback = LOCALES.en;
      const raw = dict[key] ?? fallback[key] ?? key;
      return interpolate(raw, params);
    },
    [lang],
  );

  const value = useMemo(
    () => ({ lang, setLang, toggleLang, t }),
    [lang, setLang, toggleLang, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
