import './settings-overlay.css';
import { useMemo, useState } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { IconArrowLeft } from '../icons';
import { SettingsContext } from './settings-context';
import { SECTION_REGISTRY } from './registry';
import { SettingsNav } from './SettingsNav';
import { SettingsContent } from './SettingsContent';

interface SettingsOverlayProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Settings overlay — card float mirroring LibraryOverlay (scrim + centered
 * panel, canvas stays mounted). Nav layout = horizontal tabs (locked, Task #6:
 * user picked H2). Section nav + content area. Props kept to {open,onClose};
 * the active section lives in an internal context (R3/R5). Every string via
 * i18n; every colour via tokens; open/close = data attribute (no unmount).
 */
export function SettingsOverlay({ open, onClose }: SettingsOverlayProps) {
  const { t } = useI18n();
  // Default active = first real (non-future) section — Account (R4).
  const firstReal = SECTION_REGISTRY.find((s) => !s.comingSoon) ?? SECTION_REGISTRY[0];
  const [activeId, setActiveId] = useState(firstReal.id);

  const ctxValue = useMemo(
    () => ({ activeId, setActiveId, onClose }),
    [activeId, onClose],
  );

  return (
    <div className="nib-settings-overlay" data-open={open}>
      <div className="nib-settings__scrim" onClick={onClose} aria-hidden="true" />

      <div
        className="nib-settings__panel"
        role="dialog"
        aria-modal="true"
        aria-label={t('settings.title')}
      >
        <div className="nib-settings__header">
          <button
            type="button"
            className="nib-settings__back"
            onClick={onClose}
            title={t('library.cancel')}
            aria-label={t('library.cancel')}
          >
            <IconArrowLeft width={18} height={18} />
          </button>
          <span className="nib-settings__heading">{t('settings.title')}</span>
        </div>

        <SettingsContext.Provider value={ctxValue}>
          <div className="nib-settings__inner">
            <SettingsNav sections={SECTION_REGISTRY} />
            <SettingsContent sections={SECTION_REGISTRY} />
          </div>
        </SettingsContext.Provider>
      </div>
    </div>
  );
}
