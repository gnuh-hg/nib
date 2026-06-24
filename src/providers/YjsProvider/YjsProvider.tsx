import { useEffect, useMemo, useState } from 'react';
import type { HocuspocusProvider } from '@hocuspocus/provider';
import type { IndexeddbPersistence } from 'y-indexeddb';
import type * as Y from 'yjs';
import { createYDoc } from '@/lib/yjs';
import { createIndexeddbPersistence, waitForSync } from '@/lib/yPersistence';
import { createHocuspocusProvider, getHocuspocusUrl } from '@/lib/yProvider';
import { migrateIfNeeded } from '@/lib/migration';
import { useI18n } from '@/hooks/useI18n';
import { YjsContext, type SyncStatus } from './yjs-context';

export interface YjsProviderProps {
  /** Document id — selects the Y.Doc + IndexedDB store + WS room. */
  docId: string;
  /** Supabase user id; part of the room `${userId}:${docId}`. */
  userId: string;
  /** Supabase access token. `null` → offline-only (no WS), syncStatus 'local'. */
  token: string | null;
  children: React.ReactNode;
}

/**
 * Binds the active document's Y.Doc to local IndexedDB persistence and, when a
 * token is present, to the Hocuspocus WS server.
 *
 * Lifecycle (ARCHITECTURE §A/C):
 *   createYDoc → IndexedDB persistence → waitForSync → render children →
 *   (if cloud sync enabled) connect Hocuspocus.
 * Children render as soon as local state is hydrated — never blocked on the WS
 * connection. Cloud sync is opt-in: we only connect when a token is present AND
 * VITE_HOCUSPOCUS_URL is configured; otherwise we stay 'local' (offline-only,
 * IndexedDB). All resources are destroyed on unmount / docId-userId-token change.
 */
export function YjsProvider({ docId, userId, token, children }: YjsProviderProps) {
  const { t } = useI18n();

  // Canonical Y.Doc for this docId. Shared by editor, persistence, and WS provider.
  const ydoc = useMemo(() => createYDoc(docId), [docId]);

  // Cloud sync requires both a signed-in token and a configured server URL.
  const cloudEnabled = Boolean(token) && getHocuspocusUrl() !== null;

  // Gate children on local hydration so we don't flash an empty doc.
  const [ready, setReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(cloudEnabled ? 'syncing' : 'local');
  // Migration state: 'migrated' doc (use instead of ydoc) or 'fallback' notice.
  const [activeDoc, setActiveDoc] = useState<Y.Doc>(ydoc);
  const [migrationFailed, setMigrationFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let persistence: IndexeddbPersistence | null = null;
    let provider: HocuspocusProvider | null = null;

    setReady(false);
    setMigrationFailed(false);
    setActiveDoc(ydoc);
    setSyncStatus(cloudEnabled ? 'syncing' : 'local');

    const start = async () => {
      // 1. Local persistence first (offline-first). Skip entirely when IndexedDB
      //    is unavailable (jsdom / SSR / some sandboxed webviews).
      if (typeof indexedDB !== 'undefined') {
        try {
          // Per-user store namespace: signed-in users get an isolated local copy;
          // guest (userId 'local') keeps the legacy store name.
          persistence = createIndexeddbPersistence(ydoc, docId, userId);
          await waitForSync(persistence);
        } catch {
          persistence = null;
        }
      }
      if (cancelled) return;

      // 2. Migration gate (ARCHITECTURE.md §3 — free-caret Phase B.3).
      //    Run BEFORE the editor binds to the ydoc so PM never sees old nibBlock nodes.
      //    This is intentionally after waitForSync so the ydoc is fully hydrated.
      if (typeof indexedDB !== 'undefined') {
        const migResult = await migrateIfNeeded(ydoc, docId, userId);
        if (migResult.status === 'migrated' && migResult.newDoc) {
          // Use the converted doc for the editor (row/mathInline schema).
          setActiveDoc(migResult.newDoc);
        } else if (migResult.status === 'fallback') {
          // Conversion failed — open with current ydoc (may be empty/corrupt for editor).
          // Show non-destructive notice; old data is preserved in IDB.
          setMigrationFailed(true);
        }
        // 'v2-existing' and 'empty-stamped' → use ydoc as-is.
      }
      if (cancelled) return;

      // 3. Render children now — do not block on the WS connection.
      setReady(true);

      // 4. If signed in AND a server is configured, connect for cross-device sync.
      //    Uses activeDoc (migrated or original) for the WS binding.
      const docForWs = activeDoc; // capture current value
      if (cloudEnabled && token) {
        provider = createHocuspocusProvider(docForWs, docId, userId, token);
        provider.on('synced', ({ state }: { state: boolean }) => {
          if (!cancelled && state) setSyncStatus('synced');
        });
        provider.on('status', ({ status }: { status: string }) => {
          if (cancelled) return;
          setSyncStatus((prev) => (prev === 'synced' && status === 'connected' ? prev : 'syncing'));
        });
        provider.on('authenticationFailed', () => {
          if (!cancelled) setSyncStatus('error');
        });
      } else {
        setSyncStatus('local');
      }
    };

    void start();

    return () => {
      cancelled = true;
      provider?.destroy();
      void persistence?.destroy();
    };
  }, [ydoc, docId, userId, token, cloudEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo(
    () => ({ ydoc: activeDoc, syncStatus }),
    [activeDoc, syncStatus],
  );

  // Hold children until local state is hydrated (or persistence was skipped).
  if (!ready) return null;

  return (
    <YjsContext.Provider value={value}>
      {migrationFailed && (
        <div className="nib-migration-notice" role="alert">
          <span>{t('migration.failed_preserved')}</span>
          <button
            className="nib-migration-notice__retry"
            onClick={() => window.location.reload()}
          >
            {t('migration.retry')}
          </button>
        </div>
      )}
      {children}
    </YjsContext.Provider>
  );
}
