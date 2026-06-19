import './settings-overlay.css';
import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';
import type { Lang } from '@/providers/i18n-context';
import type { ThemePref } from '@/providers/theme-context';
import { IconClose } from '../icons';

interface SettingsOverlayProps {
  open: boolean;
  onClose: () => void;
}

const LANGS: { value: Lang; labelKey: 'app.lang.en' | 'app.lang.vi' }[] = [
  { value: 'en', labelKey: 'app.lang.en' },
  { value: 'vi', labelKey: 'app.lang.vi' },
];

const THEMES: {
  value: ThemePref;
  labelKey: 'app.theme.light' | 'app.theme.dark' | 'app.theme.system';
}[] = [
  { value: 'light', labelKey: 'app.theme.light' },
  { value: 'dark', labelKey: 'app.theme.dark' },
  { value: 'system', labelKey: 'app.theme.system' },
];

/**
 * Settings overlay (nav-dock-design §5): scrim + panel, mirrors LibraryOverlay.
 * MVP = Language (en/vi) + Theme (light/dark/system). Both apply at runtime via
 * useI18n/useTheme (no reload) and persist through the providers' localStorage.
 * Every string via i18n; every color via tokens; close button ≥44px hit target.
 */
export function SettingsOverlay({ open, onClose }: SettingsOverlayProps) {
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();

  return (
    <div className="nib-settings-overlay" data-open={open}>
      <div className="nib-settings__scrim" onClick={onClose} aria-hidden="true" />

      <div className="nib-settings__panel" role="dialog" aria-modal="true">
        <div className="nib-settings__header">
          <span className="nib-settings__heading">{t('settings.title')}</span>
          <button
            type="button"
            className="nib-settings__close"
            onClick={onClose}
            title={t('library.cancel')}
            aria-label={t('library.cancel')}
          >
            <IconClose width={18} height={18} />
          </button>
        </div>

        <div className="nib-settings__body">
          <section className="nib-settings__group">
            <span className="nib-settings__label">{t('settings.language')}</span>
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

          <section className="nib-settings__group">
            <span className="nib-settings__label">{t('settings.theme')}</span>
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
        </div>
      </div>
    </div>
  );
}
