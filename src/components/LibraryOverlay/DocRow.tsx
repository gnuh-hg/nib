import { type PointerEvent } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { IconDoc, IconDotsHorizontal } from '../icons';
import { relativeTime } from '@/util/relativeTime';
import { RenameField } from './RenameField';
import type { DocEntry } from '@/types/doc';

interface DocRowProps {
  doc: DocEntry;
  renaming: boolean;
  onOpenDoc: (id: string) => void;
  onCtxOpen: (id: string, x: number, y: number) => void;
  onCommitRename: (id: string, title: string) => void;
}

/** List row: doc icon + title (or rename field) + relative time + ⋯. */
export function DocRow({
  doc,
  renaming,
  onOpenDoc,
  onCtxOpen,
  onCommitRename,
}: DocRowProps) {
  const { t, lang } = useI18n();

  const openCtx = (e: PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onCtxOpen(doc.id, e.clientX, e.clientY);
  };

  return (
    <div
      className="nib-lib-row"
      role="button"
      tabIndex={0}
      onClick={() => !renaming && onOpenDoc(doc.id)}
      title={doc.title}
    >
      <IconDoc width={15} height={15} className="nib-lib-row__icon" />
      {renaming ? (
        <span className="nib-lib-row__name">
          <RenameField
            initial={doc.title}
            onCommit={(title) => onCommitRename(doc.id, title)}
          />
        </span>
      ) : (
        <span className="nib-lib-row__name">{doc.title}</span>
      )}
      <span className="nib-lib-row__time">
        {relativeTime(doc.updatedAt, lang)}
      </span>
      <button
        type="button"
        className="nib-lib-row__ctx"
        onClick={openCtx}
        title={t('library.more')}
        aria-label={t('library.more')}
      >
        <IconDotsHorizontal width={12} height={12} />
      </button>
    </div>
  );
}
