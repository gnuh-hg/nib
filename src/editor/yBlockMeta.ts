// Yjs blockMeta side-channel bridge (Phase B, Session B.2).
//
// CC-1 (ARCHITECTURE §CC-1/§B): block layout + CAS fields live in a Yjs
// `Map "blockMeta"` keyed by block id — NOT in ProseMirror node attrs, which
// y-prosemirror does not sync reliably. Each entry is its own Y.Map so every
// field merges independently (LWW per key) across devices.
//
// This module is the typed read/write bridge; NibBlockView starts using it in
// Session B.3.

import * as Y from 'yjs';
import { getBlockMetaMap } from '@/lib/yjs';
import type { BlockMetaRecord } from '@/types/block';

export type { BlockMetaRecord };

/**
 * Defaults for a block with no meta entry yet — mirrors the old
 * `defaultBlockAttrs` layout/CAS defaults (minus the structural attrs). Used as
 * the fallback in `getBlockMeta` and the initial render value in `useBlockMeta`
 * (R3: render defaults until the entry arrives, then re-render on observe).
 */
export const DEFAULT_META: BlockMetaRecord = {
  xOffset: 0,
  lineIndex: 0,
  blockState: 'editing-math',
  latexContent: '',
  exactLatex: '',
  approxLatex: '',
  isApprox: false,
  errorKind: '',
  textScale: 'body',
  mathSize: 'normal',
  color: '',
  inkStrokes: '[]',
};

/** Read one block's meta entry into a plain record, filling any missing field. */
function readEntry(entry: Y.Map<unknown>): BlockMetaRecord {
  const field = <K extends keyof BlockMetaRecord>(key: K): BlockMetaRecord[K] => {
    const v = entry.get(key);
    return (v === undefined ? DEFAULT_META[key] : v) as BlockMetaRecord[K];
  };
  return {
    xOffset: field('xOffset'),
    lineIndex: field('lineIndex'),
    blockState: field('blockState'),
    latexContent: field('latexContent'),
    exactLatex: field('exactLatex'),
    approxLatex: field('approxLatex'),
    isApprox: field('isApprox'),
    errorKind: field('errorKind'),
    textScale: field('textScale'),
    mathSize: field('mathSize'),
    color: field('color'),
    inkStrokes: field('inkStrokes'),
  };
}

/**
 * Current meta for a block. Returns a copy of DEFAULT_META if no entry exists
 * (R3 race tolerance — a remote block may arrive before init runs locally) or
 * if `ydoc` is null (B.3→B.5 intermediate, before Workspace wires the doc).
 */
export function getBlockMeta(ydoc: Y.Doc | null, id: string): BlockMetaRecord {
  if (!ydoc) return { ...DEFAULT_META };
  const entry = getBlockMetaMap(ydoc).get(id) as Y.Map<unknown> | undefined;
  return entry ? readEntry(entry) : { ...DEFAULT_META };
}

/**
 * Merge a partial patch into a block's meta entry (creating it if needed).
 * Each field is set individually so concurrent edits to different fields merge
 * without loss. `undefined` values are ignored. Written in one transaction.
 * No-op when `ydoc` is null (B.3→B.5 intermediate).
 */
export function patchBlockMeta(
  ydoc: Y.Doc | null,
  id: string,
  patch: Partial<BlockMetaRecord>,
): void {
  if (!ydoc) return;
  const root = getBlockMetaMap(ydoc);
  ydoc.transact(() => {
    let entry = root.get(id) as Y.Map<unknown> | undefined;
    if (!entry) {
      entry = new Y.Map();
      root.set(id, entry);
    }
    for (const [key, value] of Object.entries(patch)) {
      if (value !== undefined) entry.set(key, value);
    }
  });
}

/**
 * Initialise a block's meta entry once. Idempotent: if the entry already exists
 * it is left untouched (calling twice never resets a block back to defaults).
 */
export function initBlockMeta(
  ydoc: Y.Doc | null,
  id: string,
  init: Partial<BlockMetaRecord> = {},
): void {
  if (!ydoc) return;
  const root = getBlockMetaMap(ydoc);
  ydoc.transact(() => {
    if (root.has(id)) return; // already initialised — preserve current values
    const entry = new Y.Map();
    const full: BlockMetaRecord = { ...DEFAULT_META, ...init };
    for (const [key, value] of Object.entries(full)) {
      entry.set(key, value);
    }
    root.set(id, entry);
  });
}

/** Remove a block's meta entry (called alongside PM node deletion). No-op if null. */
export function deleteBlockMeta(ydoc: Y.Doc | null, id: string): void {
  if (!ydoc) return;
  const root = getBlockMetaMap(ydoc);
  ydoc.transact(() => {
    root.delete(id);
  });
}
