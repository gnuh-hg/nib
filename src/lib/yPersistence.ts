// IndexedDB persistence for Nib's Y.Doc (Phase B, Session B.1).
//
// Offline-first foundation: the CRDT is mirrored to IndexedDB so the document
// survives reloads and edits made while offline are buffered, then merged on
// reconnect. The store name is namespaced per document.

import type * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';

/** Create the IndexedDB persistence for a doc, store `nib-ydoc-${docId}`. */
export function createIndexeddbPersistence(
  ydoc: Y.Doc,
  docId: string,
): IndexeddbPersistence {
  return new IndexeddbPersistence(`nib-ydoc-${docId}`, ydoc);
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
