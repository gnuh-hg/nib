import './library-overlay.css';
import { useI18n } from '@/hooks/useI18n';
import { IconArrowLeft, IconPlus } from '../icons';
import { LibraryToolbar } from './LibraryToolbar';
import { DocCard } from './DocCard';
import { DocRow } from './DocRow';
import { SortDropdown } from './SortDropdown';
import { DocContextMenu } from './DocContextMenu';
import { DeleteModal } from './DeleteModal';
import type { DocEntry, SortKey, ViewMode } from '@/types/doc';

interface LibraryOverlayProps {
  open: boolean;
  docs: DocEntry[];
  viewMode: ViewMode;
  sortKey: SortKey;
  sortOpen: boolean;
  ctxDoc: { id: string; x: number; y: number } | null;
  delDocId: string | null;
  renamingId: string | null;
  onClose: () => void;
  onChangeViewMode: (m: ViewMode) => void;
  onToggleSort: () => void;
  onSelectSort: (k: SortKey) => void;
  onCtxOpen: (id: string, x: number, y: number) => void;
  onCtxClose: () => void;
  onStartRename: (id: string) => void;
  onCommitRename: (id: string, title: string) => void;
  onDuplicate: (id: string) => void;
  onDeleteRequest: (id: string) => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onNew: () => void;
  onOpenDoc: (id: string) => void;
}

/**
 * Library overlay (design dòng 236–347): scrim + panel with header, toolbar,
 * grid/list body, sort dropdown, per-doc context menu and delete modal.
 * Open/close is a CSS data-attr (no conditional unmount) so the scrim/panel keep
 * their transition; sub-popovers are conditionally rendered.
 */
export function LibraryOverlay(props: LibraryOverlayProps) {
  const { t } = useI18n();
  const {
    open,
    docs,
    viewMode,
    sortKey,
    sortOpen,
    ctxDoc,
    delDocId,
    renamingId,
    onClose,
    onChangeViewMode,
    onToggleSort,
    onSelectSort,
    onCtxOpen,
    onCtxClose,
    onStartRename,
    onCommitRename,
    onDuplicate,
    onDeleteRequest,
    onDeleteConfirm,
    onDeleteCancel,
    onNew,
    onOpenDoc,
  } = props;

  const delDoc = delDocId ? docs.find((d) => d.id === delDocId) : null;

  return (
    <div className="nib-library-overlay" data-open={open}>
      <div className="nib-library__scrim" onClick={onClose} aria-hidden="true" />

      <div className="nib-library__panel" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="nib-library__header">
          <button
            type="button"
            className="nib-library__back"
            onClick={onClose}
            title={t('library.title')}
            aria-label={t('library.title')}
          >
            <IconArrowLeft width={18} height={18} />
          </button>
          <span className="nib-library__heading">{t('library.title')}</span>
          <button type="button" className="nib-library__new" onClick={onNew}>
            <IconPlus width={13} height={13} />
            {t('library.new_doc')}
          </button>
        </div>

        {/* Toolbar */}
        <LibraryToolbar
          viewMode={viewMode}
          sortKey={sortKey}
          onChangeViewMode={onChangeViewMode}
          onToggleSort={onToggleSort}
        />

        {/* Body */}
        <div className="nib-library__body">
          {viewMode === 'grid' ? (
            <div className="nib-library__grid">
              {docs.map((doc) => (
                <DocCard
                  key={doc.id}
                  doc={doc}
                  renaming={renamingId === doc.id}
                  onOpenDoc={onOpenDoc}
                  onCtxOpen={onCtxOpen}
                  onCommitRename={onCommitRename}
                />
              ))}
            </div>
          ) : (
            <div className="nib-library__list">
              {docs.map((doc) => (
                <DocRow
                  key={doc.id}
                  doc={doc}
                  renaming={renamingId === doc.id}
                  onOpenDoc={onOpenDoc}
                  onCtxOpen={onCtxOpen}
                  onCommitRename={onCommitRename}
                />
              ))}
            </div>
          )}
        </div>

        {/* Popovers / modals */}
        {sortOpen && (
          <SortDropdown
            sortKey={sortKey}
            onSelect={onSelectSort}
            onClose={onToggleSort}
          />
        )}
        {ctxDoc && (
          <DocContextMenu
            id={ctxDoc.id}
            x={ctxDoc.x}
            y={ctxDoc.y}
            onStartRename={onStartRename}
            onDuplicate={onDuplicate}
            onDeleteRequest={onDeleteRequest}
            onClose={onCtxClose}
          />
        )}
        {delDoc && (
          <DeleteModal
            docName={delDoc.title}
            onConfirm={onDeleteConfirm}
            onCancel={onDeleteCancel}
          />
        )}
      </div>
    </div>
  );
}
