import type { CSSProperties } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { IconNib, IconMarker, IconEraser } from '../icons';
import { FlyoutPanel } from './FlyoutPanel';
import { isEraserVisible, type DockMode, type PenTool } from './dockState';

interface PenTypeFlyoutProps {
  open: boolean;
  mode: DockMode;
  tool: PenTool;
  onPick: (tool: PenTool) => void;
  style?: CSSProperties;
}

/**
 * Pen-type flyout: Nib pen / Marker, plus Stroke eraser only in pen mode
 * (HTML v2: eraser is pen-mode-conditional).
 */
export function PenTypeFlyout({ open, mode, tool, onPick, style }: PenTypeFlyoutProps) {
  const { t } = useI18n();
  return (
    <FlyoutPanel
      open={open}
      title={t('dock.pen_flyout_header')}
      className="nib-dock__flyout--pen"
      style={style}
    >
      <button
        type="button"
        className="nib-dock__row"
        data-active={tool === 'nib' || undefined}
        role="menuitemradio"
        aria-checked={tool === 'nib'}
        onClick={() => onPick('nib')}
      >
        <IconNib width={14} height={14} />
        <span>{t('dock.pen_nib')}</span>
      </button>
      <button
        type="button"
        className="nib-dock__row"
        data-active={tool === 'marker' || undefined}
        role="menuitemradio"
        aria-checked={tool === 'marker'}
        onClick={() => onPick('marker')}
      >
        <IconMarker width={14} height={14} />
        <span>{t('dock.pen_marker')}</span>
      </button>
      {isEraserVisible(mode) && (
        <button
          type="button"
          className="nib-dock__row"
          data-active={tool === 'eraser' || undefined}
          role="menuitemradio"
          aria-checked={tool === 'eraser'}
          onClick={() => onPick('eraser')}
        >
          <IconEraser width={14} height={14} />
          <span>{t('dock.pen_eraser')}</span>
        </button>
      )}
    </FlyoutPanel>
  );
}
