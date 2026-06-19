import type { ReactNode } from 'react';
import { IconCornerMark } from '../icons';

interface DockBtnProps {
  title: string;
  /** Highlight when this button's flyout is open (openPop === key). */
  active?: boolean;
  onClick?: () => void;
  /** Ref callback so the dock can measure this button for overflow-aware flyout. */
  btnRef?: (el: HTMLButtonElement | null) => void;
  children: ReactNode;
}

/**
 * Generic dock slot with a flyout indicator (corner mark). Used by the pointer,
 * selection, pen-type, size and color buttons. 44px wide hit area.
 */
export function DockBtn({ title, active, onClick, btnRef, children }: DockBtnProps) {
  return (
    <button
      ref={btnRef}
      type="button"
      className="nib-dock__btn"
      data-active={active || undefined}
      title={title}
      aria-label={title}
      onClick={onClick}
    >
      {children}
      <span className="nib-dock__corner" aria-hidden="true">
        <IconCornerMark />
      </span>
    </button>
  );
}
