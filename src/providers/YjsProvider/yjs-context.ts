import { createContext, useContext } from 'react';
import type * as Y from 'yjs';

/**
 * Sync lifecycle of the active document:
 *   - 'local'   — offline-only (no token / signed out); IndexedDB is the source.
 *   - 'syncing' — connected (or reconnecting) to Hocuspocus, not yet in sync.
 *   - 'synced'  — initial sync with the server completed.
 *   - 'error'   — authentication failed (Phase C JWT) / unrecoverable.
 */
export type SyncStatus = 'local' | 'syncing' | 'synced' | 'error';

export interface YjsContextValue {
  /** The shared Y.Doc for the active document (always present). */
  ydoc: Y.Doc;
  /** Current sync lifecycle state. */
  syncStatus: SyncStatus;
}

export const YjsContext = createContext<YjsContextValue | null>(null);

/** Access the active Y.Doc + sync status. Throws outside <YjsProvider>. */
export function useYjs(): YjsContextValue {
  const ctx = useContext(YjsContext);
  if (!ctx) {
    throw new Error('useYjs must be used within <YjsProvider>');
  }
  return ctx;
}
