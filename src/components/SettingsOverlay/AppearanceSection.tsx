import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';
import type { Lang } from '@/providers/i18n-context';
import type { ThemePref } from '@/providers/theme-context';

const LANGS: { value: Lang; labelKey: 'app.lang.en' | 'app.lang.vi' }[] = [
  { value: 'en', labelKey: 'app.lang.en' },
  { value: 'vi', labelKey: 'app.lang.vi' },
];

const THEMES: {
  value: ThemePref;
  labelKey:
    | 'settings.appearance.theme.light'
    | 'settings.appearance.theme.dark'
    | 'settings.appearance.theme.system';
}[] = [
  { value: 'light', labelKey: 'settings.appearance.theme.light' },
  { value: 'dark', labelKey: 'settings.appearance.theme.dark' },
  { value: 'system', labelKey: 'settings.appearance.theme.system' },
];

/**
 * Appearance section — Theme + Language merged (both "look & feel"). Migrated
 * from the old single-panel SettingsOverlay. Both apply at runtime (no reload)
 * via useTheme / useI18n and persist through their providers.
 */
export function AppearanceSection() {
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();

  return (
    <div className="nib-settings-appearance">
      <h2 className="nib-settings__section-title">{t('settings.appearance.title')}</h2>

      <section className="nib-settings__group">
        <span className="nib-settings__label">{t('settings.appearance.theme')}</span>
        <div className="nib-settings__seg" role="group">
          {THEMES.map(({ value, labelKey }) => (
            <button
              key={value}
              type="button"
              className="nib-settings__opt"
              data-active={theme === value}
              aria-pressed={theme === value}
              onClick={() => setTheme(value)}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </section>

      <section className="nib-settings__group">
        <span className="nib-settings__label">{t('settings.appearance.language')}</span>
        <div className="nib-settings__seg" role="group">
          {LANGS.map(({ value, labelKey }) => (
            <button
              key={value}
              type="button"
              className="nib-settings__opt"
              data-active={lang === value}
              aria-pressed={lang === value}
              onClick={() => setLang(value)}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
