// Convenience hook exposing the active document's sync status (Phase B, B.2).
// Thin wrapper over the YjsProvider context so UI (e.g. a TopStrip sync badge)
// can read 'local' | 'syncing' | 'synced' | 'error' without pulling in the ydoc.

import { useYjs, type SyncStatus } from '@/providers/YjsProvider';

/** Current sync lifecycle state of the active document. */
export function useYjsStatus(): SyncStatus {
  return useYjs().syncStatus;
}
