// Migration module — NEUTERED 2026-06-25 (typing/editor-document layer wipe).
//
// The old nibBlock→row free-caret migration was removed together with the entire
// block/row schema. A fresh typing schema will be built from zero in a new chat,
// so there is nothing to migrate yet. This file keeps the `migrateIfNeeded`
// contract that <YjsProvider> awaits, as a no-op that never touches IndexedDB and
// never reports a fallback (so no migration-failure notice is shown).
//
// HARD CONSTRAINT (unchanged): indexedDB.deleteDatabase is NEVER called.

import type * as Y from 'yjs';

export interface MigrationResult {
  status: 'v2-existing' | 'empty-stamped' | 'migrated' | 'fallback';
  /** Present only when status==='migrated'. Always absent in the no-op. */
  newDoc?: Y.Doc;
  error?: string;
}

/**
 * No-op migration gate. Returns 'v2-existing' so <YjsProvider> uses the loaded
 * ydoc as-is (no conversion, no fallback notice). // TODO rebuild typing: when a
 * real schema exists, reintroduce versioned migration if old stores must convert.
 */
export async function migrateIfNeeded(
  _ydoc: Y.Doc,
  _docId: string,
  _userId: string,
): Promise<MigrationResult> {
  return { status: 'v2-existing' };
}
