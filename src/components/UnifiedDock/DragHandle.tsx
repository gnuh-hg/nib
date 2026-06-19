import type { PointerEventHandler } from 'react';
import { IconDragHandle } from '../icons';

interface DragHandleProps {
  title: string;
  onPointerDown?: PointerEventHandler<HTMLDivElement>;
  onPointerMove?: PointerEventHandler<HTMLDivElement>;
  onPointerUp?: PointerEventHandler<HTMLDivElement>;
  onPointerCancel?: PointerEventHandler<HTMLDivElement>;
}

/**
 * 6-dot grip. Phase 3: drag-to-reposition the whole dock (pointer handlers wired
 * from UnifiedDock; touch-action:none via dock.css).
 */
export function DragHandle({
  title,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: DragHandleProps) {
  return (
    <div
      className="nib-dock__drag"
      title={title}
      aria-label={title}
      role="presentation"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <IconDragHandle width={18} height={8} />
    </div>
  );
}
