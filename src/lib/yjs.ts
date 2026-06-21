// Yjs document core for Nib (Accounts + Cloud Sync — Phase B, Session B.1).
//
// One Y.Doc per docId, cached so every consumer (editor, persistence, WS
// provider) shares the exact same CRDT instance. The shared types live here so
// the names never drift between modules:
//   - XmlFragment "prosemirror" — managed by y-prosemirror / TipTap (the doc
//     skeleton + nibBlock nodes).
//   - Map "blockMeta"           — the CC-1 side-channel for block layout/CAS
//     fields (xOffset, lineIndex, latexContent, exactLatex, …). Kept OUT of
//     ProseMirror node attrs because y-prosemirror does not sync attrs reliably
//     (see ARCHITECTURE.md §CC-1). Populated in Session B.2.

import * as Y from 'yjs';

/** Shared-type key for the ProseMirror document fragment. */
export const PROSEMIRROR_FRAGMENT = 'prosemirror';
/** Shared-type key for the block-meta side-channel map (CC-1). */
export const BLOCK_META_MAP = 'blockMeta';

/** Per-docId Y.Doc cache — guarantees a single shared instance per document. */
const docCache = new Map<string, Y.Doc>();

/**
 * Get (or lazily create) the singleton Y.Doc for a document id.
 * Repeated calls with the same docId return the identical instance so the
 * editor, IndexedDB persistence and the WS provider all bind to one CRDT.
 */
export function createYDoc(docId: string): Y.Doc {
  const existing = docCache.get(docId);
  if (existing) return existing;
  const doc = new Y.Doc();
  docCache.set(docId, doc);
  return doc;
}

/** The shared ProseMirror XML fragment for this doc (y-prosemirror binds to it). */
export function getProseMirrorFragment(ydoc: Y.Doc): Y.XmlFragment {
  return ydoc.getXmlFragment(PROSEMIRROR_FRAGMENT);
}

/** The shared block-meta map for this doc (CC-1 side-channel; filled in B.2). */
export function getBlockMetaMap(ydoc: Y.Doc): Y.Map<unknown> {
  return ydoc.getMap(BLOCK_META_MAP);
}

/**
 * Drop cached Y.Doc(s). Intended for tests / teardown so a fresh doc can be
 * created; not used in normal app flow (docs persist for the session).
 */
export function _resetYDocCache(docId?: string): void {
  if (docId) docCache.delete(docId);
  else docCache.clear();
}
