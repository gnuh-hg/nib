import { useLayoutEffect, useRef, useState } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { IconPencil, IconCopy, IconTrash } from '../icons';

const EDGE_GAP = 8;

interface DocContextMenuProps {
  id: string;
  x: number;
  y: number;
  onStartRename: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDeleteRequest: (id: string) => void;
  onClose: () => void;
}

/** Per-doc context menu (design dòng 329–334). Fixed at the click position. */
export function DocContextMenu({
  id,
  x,
  y,
  onStartRename,
  onDuplicate,
  onDeleteRequest,
  onClose,
}: DocContextMenuProps) {
  const { t } = useI18n();
  const menuRef = useRef<HTMLDivElement>(null);
  // Clamp the fixed menu inside the viewport so it never overflows off-screen
  // when the ⋯ trigger sits near the right/bottom edge.
  const [pos, setPos] = useState({ left: x, top: y });

  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const maxLeft = window.innerWidth - width - EDGE_GAP;
    const maxTop = window.innerHeight - height - EDGE_GAP;
    setPos({
      left: Math.max(EDGE_GAP, Math.min(x, maxLeft)),
      top: Math.max(EDGE_GAP, Math.min(y, maxTop)),
    });
  }, [x, y]);

  return (
    <>
      <div className="nib-lib-popover-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={menuRef}
        className="nib-lib-ctx"
        role="menu"
        style={{ left: pos.left, top: pos.top }}
      >
        <button
          type="button"
          role="menuitem"
          className="nib-lib-ctx__opt"
          onClick={() => onStartRename(id)}
        >
          <IconPencil width={13} height={13} />
          {t('library.rename')}
        </button>
        <button
          type="button"
          role="menuitem"
          className="nib-lib-ctx__opt"
          onClick={() => onDuplicate(id)}
        >
          <IconCopy width={13} height={13} />
          {t('library.duplicate')}
        </button>
        <div className="nib-lib-ctx__sep" aria-hidden="true" />
        <button
          type="button"
          role="menuitem"
          className="nib-lib-ctx__opt nib-lib-ctx__opt--danger"
          onClick={() => onDeleteRequest(id)}
        >
          <IconTrash width={13} height={13} />
          {t('library.delete')}
        </button>
      </div>
    </>
  );
}
