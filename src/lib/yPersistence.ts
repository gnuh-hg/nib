// IndexedDB persistence for Nib's Y.Doc (Phase B, Session B.1).
//
// Offline-first foundation: the CRDT is mirrored to IndexedDB so the document
// survives reloads and edits made while offline are buffered, then merged on
// reconnect. The store name is namespaced per user *and* per document.

import type * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';

/**
 * IndexedDB database name for a document, namespaced per user so that signing
 * in/out never mixes — or destroys — another identity's local documents
 * (sign-out closes the handle, it never deletes the store).
 *   - guest / signed-out (userId falsy or 'local') → legacy name
 *     `nib-ydoc-${docId}` (backward-compatible: pre-existing guest documents
 *     stay readable after this change).
 *   - signed-in → `nib-ydoc-u-${userId}__${docId}`.
 * `userId` is sanitised to safe characters so the database name is always valid
 * even if an id ever contains a `:` or other reserved character.
 */
export function idbStoreName(docId: string, userId?: string | null): string {
  if (!userId || userId === 'local') return `nib-ydoc-${docId}`;
  const safe = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `nib-ydoc-u-${safe}__${docId}`;
}

/**
 * Create the IndexedDB persistence for a doc. The store is namespaced by
 * `idbStoreName(docId, userId)` so each signed-in user has an isolated local
 * copy; signed-out (guest) keeps the legacy `nib-ydoc-${docId}` store.
 */
export function createIndexeddbPersistence(
  ydoc: Y.Doc,
  docId: string,
  userId?: string | null,
): IndexeddbPersistence {
  return new IndexeddbPersistence(idbStoreName(docId, userId), ydoc);
}

/**
 * Resolve once the local IndexedDB state has been loaded into the Y.Doc — or
 * immediately if IndexedDB is unavailable / disabled (Firefox private mode,
 * jsdom). Used to render the editor only after local content is hydrated
 * (avoids an empty-then-populated flash) without ever hanging or rejecting.
 *
 * Why this is defensive: y-indexeddb's `whenSynced` only resolves on a
 * successful 'synced' event and never settles on failure, while its internal db
 * promise rejects with no handler. We race the two so a broken store resolves
 * gracefully (and the otherwise-unhandled rejection is swallowed). The doc still
 * works — it just runs without local persistence.
 */
export function waitForSync(persistence: IndexeddbPersistence): Promise<void> {
  const dbPromise = (persistence as unknown as { _db?: Promise<unknown> })._db;
  // On db failure → resolve (skip wait). On db success → never resolve here, so
  // `whenSynced` is the resolver (avoids racing ahead of hydration).
  const onDbFailure: Promise<void> = dbPromise
    ? dbPromise.then(
        () => new Promise<void>(() => {}),
        () => undefined,
      )
    : Promise.resolve();
  return Promise.race([persistence.whenSynced.then(() => undefined), onDbFailure]);
}
