import type { CSSProperties } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { SWATCH_NAMES } from '../SwatchPicker';
import { FlyoutPanel } from './FlyoutPanel';

interface ColorFlyoutProps {
  open: boolean;
  color: string;
  onPick: (color: string) => void;
  style?: CSSProperties;
}

/**
 * Ink-color flyout — 8-swatch grid (reuses SWATCH_NAMES). Colors are data via
 * --swatch-* tokens. Active swatch gets a double-ring.
 */
export function ColorFlyout({ open, color, onPick, style }: ColorFlyoutProps) {
  const { t } = useI18n();
  return (
    <FlyoutPanel
      open={open}
      title={t('dock.color_ink')}
      className="nib-dock__flyout--color"
      style={style}
    >
      <div className="nib-dock__swatch-grid">
        {SWATCH_NAMES.map((name) => (
          <button
            key={name}
            type="button"
            className="nib-dock__swatch"
            data-active={name === color || undefined}
            style={{ backgroundColor: `var(--swatch-${name})` }}
            title={name}
            aria-label={name}
            aria-pressed={name === color}
            onClick={() => onPick(name)}
          />
        ))}
      </div>
    </FlyoutPanel>
  );
}
