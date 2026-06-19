import type { CSSProperties } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { IconCursor, IconPan } from '../icons';
import { FlyoutPanel } from './FlyoutPanel';
import type { PtrTool } from './dockState';

interface PointerFlyoutProps {
  open: boolean;
  tool: PtrTool;
  onPick: (tool: PtrTool) => void;
  style?: CSSProperties;
}

/** Pointer flyout: Cursor / Pan canvas. */
export function PointerFlyout({ open, tool, onPick, style }: PointerFlyoutProps) {
  const { t } = useI18n();
  return (
    <FlyoutPanel
      open={open}
      title={t('dock.ptr_flyout_header')}
      className="nib-dock__flyout--ptr"
      style={style}
    >
      <button
        type="button"
        className="nib-dock__row"
        data-active={tool === 'cursor' || undefined}
        role="menuitemradio"
        aria-checked={tool === 'cursor'}
        onClick={() => onPick('cursor')}
      >
        <IconCursor width={14} height={14} />
        <span>{t('dock.ptr_cursor')}</span>
      </button>
      <button
        type="button"
        className="nib-dock__row"
        data-active={tool === 'pan' || undefined}
        role="menuitemradio"
        aria-checked={tool === 'pan'}
        onClick={() => onPick('pan')}
      >
        <IconPan width={14} height={14} />
        <span>{t('dock.ptr_pan')}</span>
      </button>
    </FlyoutPanel>
  );
}
