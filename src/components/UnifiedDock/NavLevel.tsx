import type { I18nContextValue } from '@/providers/i18n-context';
import {
  IconLayoutGrid,
  IconSettings,
  IconKbd,
  IconPenNib,
  IconHelp,
} from '../icons';

export interface NavLevelProps {
  t: I18nContextValue['t'];
  onLibrary: () => void;
  onSettings: () => void;
  onType: () => void;
  onWrite: () => void;
  onHelp: () => void;
}

/**
 * Level NAV of the drill-down dock (nav-dock-design §1). App-level navigation:
 * [Library] [Settings] [Type] [Write] [Help]. Type/Write are the single mode
 * entry points (they replace the deleted ModeToggle). The account chip was
 * removed 2026-06-18 (it duplicated the Settings entry — user request).
 */
export function NavLevel({
  t,
  onLibrary,
  onSettings,
  onType,
  onWrite,
  onHelp,
}: NavLevelProps) {
  return (
    <div className="nib-dock__nav" role="group" aria-label={t('dock.label')}>
      <button
        type="button"
        className="nib-dock__btn nib-dock__navbtn"
        title={t('dock.nav.library')}
        aria-label={t('dock.nav.library')}
        onClick={onLibrary}
      >
        <IconLayoutGrid width={18} height={18} />
      </button>
      <button
        type="button"
        className="nib-dock__btn nib-dock__navbtn"
        title={t('dock.nav.settings')}
        aria-label={t('dock.nav.settings')}
        onClick={onSettings}
      >
        <IconSettings width={18} height={18} />
      </button>

      <span className="nib-dock__divider" aria-hidden="true" />

      <button
        type="button"
        className="nib-dock__btn nib-dock__navbtn"
        title={t('dock.nav.type')}
        aria-label={t('dock.nav.type')}
        onClick={onType}
      >
        <IconKbd width={18} height={18} />
      </button>
      <button
        type="button"
        className="nib-dock__btn nib-dock__navbtn"
        title={t('dock.nav.write')}
        aria-label={t('dock.nav.write')}
        onClick={onWrite}
      >
        <IconPenNib width={18} height={18} />
      </button>
      <button
        type="button"
        className="nib-dock__btn nib-dock__navbtn"
        title={t('dock.nav.help')}
        aria-label={t('dock.nav.help')}
        onClick={onHelp}
      >
        <IconHelp width={18} height={18} />
      </button>
    </div>
  );
}
