import type { ReactNode } from 'react';

interface CalcBtnProps {
  title: string;
  /** Apply the pulse animation while the active block is evaluating. */
  pulsing?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

/**
 * Primary accent action (Tính). Always visible, 44×44 (primary hit target).
 * Editor wiring lands in Session 2.1.
 */
export function CalcBtn({ title, pulsing, onClick, children }: CalcBtnProps) {
  return (
    <button
      type="button"
      className="nib-dock__calc"
      data-pulsing={pulsing || undefined}
      title={title}
      aria-label={title}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
