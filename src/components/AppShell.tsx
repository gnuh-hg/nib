import './app-shell.css';
import { useState } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { useSessionExpiredNotice } from '@/hooks/useSessionExpiredNotice';
import { Workspace } from './Workspace';
import { LibraryOverlay } from './LibraryOverlay';
import { SettingsOverlay } from './SettingsOverlay';
import { LoginModal } from './LoginModal';
import { IconAlertCircle, IconClose } from './icons';
import { MOCK_DOCS } from '@/data/mockDocs';
import { sortDocs, type DocEntry, type SortKey, type ViewMode } from '@/types/doc';

/** A fresh document id + entry (mock store until a real backend/store lands). */
function makeDoc(title: string): DocEntry {
  const now = new Date().toISOString();
  return { id: `doc-${Date.now()}`, title, createdAt: now, updatedAt: now };
}

/**
 * App shell: small-screen guard + the editor workspace + the library overlay.
 * Owns the document list (mock, mutable), the active document and all library
 * UI state. The same `docs` source feeds both the rail and the library.
 */
export function AppShell() {
  const { t } = useI18n();
  const { expired, dismiss } = useSessionExpiredNotice();
  const [docs, setDocs] = useState<DocEntry[]>(MOCK_DOCS);
  const [activeDocId, setActiveDocId] = useState(MOCK_DOCS[0].id);

  const [libOpen, setLibOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortKey, setSortKey] = useState<SortKey>('modified');
  const [sortOpen, setSortOpen] = useState(false);
  const [ctxDoc, setCtxDoc] = useState<{ id: string; x: number; y: number } | null>(
    null,
  );
  const [delDocId, setDelDocId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  const closeLibrary = () => {
    setLibOpen(false);
    setSortOpen(false);
    setCtxDoc(null);
    setDelDocId(null);
    setRenamingId(null);
  };

  const openDoc = (id: string) => {
    setActiveDocId(id);
    closeLibrary();
  };

  // ---- Mutating handlers (mock store) ----
  const handleNew = () => {
    const doc = makeDoc('Untitled document');
    setDocs((d) => [doc, ...d]);
    setActiveDocId(doc.id);
    closeLibrary();
  };

  const handleSelectSort = (key: SortKey) => {
    setSortKey(key);
    setDocs((d) => sortDocs(d, key));
    setSortOpen(false);
  };

  const handleCommitRename = (id: string, title: string) => {
    const next = title.trim();
    setDocs((d) =>
      d.map((x) =>
        x.id === id && next
          ? { ...x, title: next, updatedAt: new Date().toISOString() }
          : x,
      ),
    );
    setRenamingId(null);
  };

  const handleDuplicate = (id: string) => {
    setDocs((d) => {
      const i = d.findIndex((x) => x.id === id);
      if (i === -1) return d;
      const copy = makeDoc(`${d[i].title} (copy)`);
      return [...d.slice(0, i + 1), copy, ...d.slice(i + 1)];
    });
    setCtxDoc(null);
  };

  const handleDeleteConfirm = () => {
    if (!delDocId) return;
    setDocs((d) => {
      const next = d.filter((x) => x.id !== delDocId);
      if (delDocId === activeDocId && next[0]) setActiveDocId(next[0].id);
      return next;
    });
    setDelDocId(null);
  };

  return (
    <div className="nib-app">
      {/* Below 1024px / portrait we show a notice instead of cramming the layout. */}
      <div className="nib-small-screen">
        <p className="nib-small-screen__inner">{t('app.small_screen_notice')}</p>
      </div>

      <div className="nib-shell">
        <Workspace
          docs={docs}
          activeDocId={activeDocId}
          onOpenLibrary={() => setLibOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenLogin={() => setLoginOpen(true)}
        />
      </div>

      <LibraryOverlay
        open={libOpen}
        docs={docs}
        viewMode={viewMode}
        sortKey={sortKey}
        sortOpen={sortOpen}
        ctxDoc={ctxDoc}
        delDocId={delDocId}
        renamingId={renamingId}
        onClose={closeLibrary}
        onChangeViewMode={setViewMode}
        onToggleSort={() => setSortOpen((o) => !o)}
        onSelectSort={handleSelectSort}
        onCtxOpen={(id, x, y) => setCtxDoc({ id, x, y })}
        onCtxClose={() => setCtxDoc(null)}
        onStartRename={(id) => {
          setRenamingId(id);
          setCtxDoc(null);
        }}
        onCommitRename={handleCommitRename}
        onDuplicate={handleDuplicate}
        onDeleteRequest={(id) => {
          setDelDocId(id);
          setCtxDoc(null);
        }}
        onDeleteConfirm={handleDeleteConfirm}
        onDeleteCancel={() => setDelDocId(null)}
        onNew={handleNew}
        onOpenDoc={openDoc}
      />

      <SettingsOverlay
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />

      {/* Session-expired notice: an involuntary sign-out (expired/revoked token).
          Local documents are intact; prompt the user to sign back in to resume sync. */}
      {expired && (
        <div className="nib-session-banner" role="alert">
          <span className="nib-session-banner__icon" aria-hidden="true">
            <IconAlertCircle width={16} height={16} />
          </span>
          <span className="nib-session-banner__text">{t('auth.session_expired')}</span>
          <button
            type="button"
            className="nib-session-banner__action"
            onClick={() => {
              dismiss();
              setLoginOpen(true);
            }}
          >
            {t('account.open_login')}
          </button>
          <button
            type="button"
            className="nib-session-banner__dismiss"
            onClick={dismiss}
            title={t('library.cancel')}
            aria-label={t('library.cancel')}
          >
            <IconClose width={14} height={14} />
          </button>
        </div>
      )}
    </div>
  );
}
