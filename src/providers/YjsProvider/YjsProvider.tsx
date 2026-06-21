import { useEffect, useMemo, useState } from 'react';
import type { HocuspocusProvider } from '@hocuspocus/provider';
import type { IndexeddbPersistence } from 'y-indexeddb';
import { createYDoc } from '@/lib/yjs';
import { createIndexeddbPersistence, waitForSync } from '@/lib/yPersistence';
import { createHocuspocusProvider } from '@/lib/yProvider';
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
 *   (if token) connect Hocuspocus.
 * Children render as soon as local state is hydrated — never blocked on the WS
 * connection. With no token we stay 'local' (offline-only). All resources are
 * destroyed on unmount / docId-userId-token change.
 */
export function YjsProvider({ docId, userId, token, children }: YjsProviderProps) {
  // Same shared Y.Doc instance for editor + persistence + provider.
  const ydoc = useMemo(() => createYDoc(docId), [docId]);

  // Gate children on local hydration so we don't flash an empty doc.
  const [ready, setReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(token ? 'syncing' : 'local');

  useEffect(() => {
    let cancelled = false;
    let persistence: IndexeddbPersistence | null = null;
    let provider: HocuspocusProvider | null = null;

    setReady(false);
    setSyncStatus(token ? 'syncing' : 'local');

    const start = async () => {
      // 1. Local persistence first (offline-first). Skip entirely when IndexedDB
      //    is unavailable (jsdom / SSR / some sandboxed webviews) so the editor
      //    still renders; y-indexeddb would otherwise raise an unhandled
      //    rejection deep in its internals. waitForSync stays resilient for the
      //    private-mode case where indexedDB exists but open() rejects.
      if (typeof indexedDB !== 'undefined') {
        try {
          persistence = createIndexeddbPersistence(ydoc, docId);
          await waitForSync(persistence);
        } catch {
          persistence = null;
        }
      }
      if (cancelled) return;

      // 2. Render children now — do not block on the WS connection.
      setReady(true);

      // 3. If signed in, connect to Hocuspocus for cross-device sync.
      if (token) {
        provider = createHocuspocusProvider(ydoc, docId, userId, token);
        provider.on('synced', ({ state }: { state: boolean }) => {
          if (!cancelled && state) setSyncStatus('synced');
        });
        provider.on('status', ({ status }: { status: string }) => {
          if (cancelled) return;
          // 'connected' before the first 'synced' is still "syncing";
          // 'connecting'/'disconnected' means we're (re)establishing the link.
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
  }, [ydoc, docId, userId, token]);

  const value = useMemo(() => ({ ydoc, syncStatus }), [ydoc, syncStatus]);

  // Hold children until local state is hydrated (or persistence was skipped).
  if (!ready) return null;

  return <YjsContext.Provider value={value}>{children}</YjsContext.Provider>;
}
