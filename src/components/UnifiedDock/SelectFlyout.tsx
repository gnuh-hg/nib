import type { CSSProperties } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { IconRectSelect, IconLasso } from '../icons';
import { FlyoutPanel } from './FlyoutPanel';
import type { SelTool } from './dockState';

interface SelectFlyoutProps {
  open: boolean;
  tool: SelTool;
  onPick: (tool: SelTool) => void;
  style?: CSSProperties;
}

/** Selection flyout: Rectangle / Free lasso. */
export function SelectFlyout({ open, tool, onPick, style }: SelectFlyoutProps) {
  const { t } = useI18n();
  return (
    <FlyoutPanel
      open={open}
      title={t('dock.sel_flyout_header')}
      className="nib-dock__flyout--sel"
      style={style}
    >
      <button
        type="button"
        className="nib-dock__row"
        data-active={tool === 'rect' || undefined}
        role="menuitemradio"
        aria-checked={tool === 'rect'}
        onClick={() => onPick('rect')}
      >
        <IconRectSelect width={14} height={14} />
        <span>{t('dock.sel_rect')}</span>
      </button>
      <button
        type="button"
        className="nib-dock__row"
        data-active={tool === 'lasso' || undefined}
        role="menuitemradio"
        aria-checked={tool === 'lasso'}
        onClick={() => onPick('lasso')}
      >
        <IconLasso width={14} height={14} />
        <span>{t('dock.sel_lasso')}</span>
      </button>
    </FlyoutPanel>
  );
}
