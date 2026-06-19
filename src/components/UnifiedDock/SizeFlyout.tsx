import type { CSSProperties } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { FlyoutPanel } from './FlyoutPanel';
import type { DockMode, PenSize } from './dockState';

interface SizeFlyoutProps {
  open: boolean;
  mode: DockMode;
  penSize: PenSize;
  onPick: (size: PenSize) => void;
  style?: CSSProperties;
}

/**
 * Size flyout — mode-aware (HTML v2). Pen mode wires stroke size (2/4/6).
 * Type mode shows static font-size rows (no font-size state until a later
 * phase; medium stays the active default per HTML).
 */
export function SizeFlyout({ open, mode, penSize, onPick, style }: SizeFlyoutProps) {
  const { t } = useI18n();
  const isPen = mode === 'pen';
  return (
    <FlyoutPanel
      open={open}
      title={isPen ? t('dock.size_stroke') : t('dock.size_font')}
      className="nib-dock__flyout--size"
      style={style}
    >
      {isPen ? (
        <>
          <button
            type="button"
            className="nib-dock__row"
            data-active={penSize === 2 || undefined}
            role="menuitemradio"
            aria-checked={penSize === 2}
            onClick={() => onPick(2)}
          >
            <span className="nib-dock__dot nib-dock__dot--thin" />
            <span>{t('dock.size_thin')}</span>
          </button>
          <button
            type="button"
            className="nib-dock__row"
            data-active={penSize === 4 || undefined}
            role="menuitemradio"
            aria-checked={penSize === 4}
            onClick={() => onPick(4)}
          >
            <span className="nib-dock__dot nib-dock__dot--med" />
            <span>{t('dock.size_medium_stroke')}</span>
          </button>
          <button
            type="button"
            className="nib-dock__row"
            data-active={penSize === 6 || undefined}
            role="menuitemradio"
            aria-checked={penSize === 6}
            onClick={() => onPick(6)}
          >
            <span className="nib-dock__dot nib-dock__dot--thick" />
            <span>{t('dock.size_thick')}</span>
          </button>
        </>
      ) : (
        <>
          <div className="nib-dock__row" role="menuitem">
            <span className="nib-dock__sizeletter nib-dock__sizeletter--s">S</span>
            <span>{t('dock.size_small_font')}</span>
          </div>
          <div className="nib-dock__row" data-active role="menuitem">
            <span className="nib-dock__sizeletter nib-dock__sizeletter--m">M</span>
            <span>{t('dock.size_medium_font')}</span>
          </div>
          <div className="nib-dock__row" role="menuitem">
            <span className="nib-dock__sizeletter nib-dock__sizeletter--l">L</span>
            <span>{t('dock.size_large_font')}</span>
          </div>
        </>
      )}
    </FlyoutPanel>
  );
}
