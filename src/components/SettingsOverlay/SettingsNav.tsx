import { useI18n } from '@/hooks/useI18n';
import { useSettingsContext } from './settings-context';
import type { SectionDef } from './registry';

interface SettingsNavProps {
  sections: SectionDef[];
}

/**
 * Section navigation rendered as a horizontal tab bar (settings-overlay.css).
 * Layout-neutral: the HTML carries no width/position — the visual layout lives
 * entirely in CSS. Each item ≥44px hit target.
 */
export function SettingsNav({ sections }: SettingsNavProps) {
  const { t } = useI18n();
  const { activeId, setActiveId } = useSettingsContext();

  return (
    <nav className="nib-settings__nav" aria-label={t('settings.title')}>
      <ul className="nib-settings__nav-list">
        {sections.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              className="nib-settings__nav-item"
              data-active={!s.comingSoon && s.id === activeId}
              data-coming-soon={s.comingSoon ? true : undefined}
              disabled={s.comingSoon}
              aria-current={!s.comingSoon && s.id === activeId ? 'page' : undefined}
              onClick={() => {
                if (!s.comingSoon) setActiveId(s.id);
              }}
            >
              <span className="nib-settings__nav-icon" aria-hidden="true">
                {s.icon}
              </span>
              <span className="nib-settings__nav-label">{t(s.i18nKey)}</span>
              {s.comingSoon && (
                <span className="nib-settings__nav-badge">
                  {t('settings.nav.coming_soon')}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
