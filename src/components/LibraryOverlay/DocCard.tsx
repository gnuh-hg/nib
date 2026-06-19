import { type PointerEvent } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { IconDotsHorizontal } from '../icons';
import { relativeTime } from '@/util/relativeTime';
import { RenameField } from './RenameField';
import type { DocEntry } from '@/types/doc';

interface DocCardProps {
  doc: DocEntry;
  renaming: boolean;
  onOpenDoc: (id: string) => void;
  onCtxOpen: (id: string, x: number, y: number) => void;
  onCommitRename: (id: string, title: string) => void;
}

/** Grid card: ruled preview + title (or rename field) + relative time + ⋯. */
export function DocCard({
  doc,
  renaming,
  onOpenDoc,
  onCtxOpen,
  onCommitRename,
}: DocCardProps) {
  const { t, lang } = useI18n();

  const openCtx = (e: PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onCtxOpen(doc.id, e.clientX, e.clientY);
  };

  return (
    <div
      className="nib-lib-card"
      role="button"
      tabIndex={0}
      onClick={() => !renaming && onOpenDoc(doc.id)}
      title={doc.title}
    >
      <div className="nib-lib-card__preview" aria-hidden="true" />
      <div className="nib-lib-card__footer">
        {renaming ? (
          <RenameField
            initial={doc.title}
            onCommit={(title) => onCommitRename(doc.id, title)}
          />
        ) : (
          <div className="nib-lib-card__name">{doc.title}</div>
        )}
        <div className="nib-lib-card__time">
          {t('sidebar.doc_updated', { time: relativeTime(doc.updatedAt, lang) })}
        </div>
      </div>
      <button
        type="button"
        className="nib-lib-card__ctx"
        onClick={openCtx}
        title={t('library.more')}
        aria-label={t('library.more')}
      >
        <IconDotsHorizontal width={12} height={12} />
      </button>
    </div>
  );
}
