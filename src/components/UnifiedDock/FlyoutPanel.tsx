import type { CSSProperties, ReactNode } from 'react';

interface FlyoutPanelProps {
  open: boolean;
  /** Localized header label (uppercase styling applied via CSS). */
  title: string;
  /** Position/width modifier class (nib-dock__flyout--ptr, etc.). */
  className: string;
  /** Overflow-aware top override (computed in UnifiedDock, Session 3.2). */
  style?: CSSProperties;
  children: ReactNode;
}

/**
 * Generic popover wrapper. Open/close animation (opacity + translateX) driven
 * by data-open. `style` overrides the CSS `top` fallback with the JS-computed,
 * overflow-aware position (Session 3.2).
 */
export function FlyoutPanel({ open, title, className, style, children }: FlyoutPanelProps) {
  return (
    <div
      className={`nib-dock__flyout ${className}`}
      data-open={open || undefined}
      style={style}
      role="menu"
      aria-hidden={!open}
    >
      <div className="nib-dock__flyout-header">{title}</div>
      {children}
    </div>
  );
}
