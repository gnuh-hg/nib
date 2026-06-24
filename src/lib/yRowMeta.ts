// Yjs rowMeta side-channel bridge (Phase B.2 free-caret rebuild).
//
// Mirrors the blockMeta pattern (ARCHITECTURE.md §2):
//   Map "rowMeta" — keyed by row-id (Row PM node `id` attr).
//   Each entry is its own Y.Map { blankBefore, indent } so fields merge
//   independently (LWW per key) across devices.
//
// blankBefore: number of blank ruled-lines above this row (virtual gap, R1).
// indent: horizontal offset in px from the paper left edge (virtual indent, R1).
//
// Layout is NEVER stored in PM node attrs (CC-1 constraint).

import * as Y from 'yjs';
import { getRowMetaMap } from '@/lib/yjs';

/** Layout record for one row stored in the `rowMeta` Yjs side-channel. */
export interface RowMetaRecord {
  /** Number of blank ruled-lines visually above this row (virtual space — R1). */
  blankBefore: number;
  /** Leading horizontal offset in px from the paper left edge (virtual indent — R1). */
  indent: number;
}

/**
 * Default layout for a row with no meta entry yet (R3 race tolerance:
 * render defaults until the entry arrives, then re-render on observe).
 */
export const DEFAULT_ROW_META: RowMetaRecord = {
  blankBefore: 0,
  indent: 0,
};

/** Read one row's meta entry into a plain record, filling any missing field. */
function readRowEntry(entry: Y.Map<unknown>): RowMetaRecord {
  const field = <K extends keyof RowMetaRecord>(key: K): RowMetaRecord[K] => {
    const v = entry.get(key);
    return (v === undefined ? DEFAULT_ROW_META[key] : v) as RowMetaRecord[K];
  };
  return {
    blankBefore: field('blankBefore'),
    indent: field('indent'),
  };
}

/**
 * Current layout for a row. Returns DEFAULT_ROW_META if no entry exists
 * (R3 race tolerance — remote row may arrive before initRowMeta runs locally)
 * or if `ydoc` is null.
 */
export function getRowMeta(ydoc: Y.Doc | null, rowId: string): RowMetaRecord {
  if (!ydoc) return { ...DEFAULT_ROW_META };
  const entry = getRowMetaMap(ydoc).get(rowId) as Y.Map<unknown> | undefined;
  return entry ? readRowEntry(entry) : { ...DEFAULT_ROW_META };
}

/**
 * Merge a partial patch into a row's meta entry (creating it if needed).
 * Each field is set individually so concurrent edits to different fields merge
 * without loss (LWW per key). Written in one transaction.
 * No-op when `ydoc` is null.
 */
export function patchRowMeta(
  ydoc: Y.Doc | null,
  rowId: string,
  patch: Partial<RowMetaRecord>,
): void {
  if (!ydoc) return;
  const root = getRowMetaMap(ydoc);
  ydoc.transact(() => {
    let entry = root.get(rowId) as Y.Map<unknown> | undefined;
    if (!entry) {
      entry = new Y.Map();
      root.set(rowId, entry);
    }
    for (const [key, value] of Object.entries(patch)) {
      if (value !== undefined) entry.set(key, value);
    }
  });
}

/**
 * Initialise a row's meta entry once. Idempotent: if the entry already exists
 * it is left untouched (calling twice never resets layout back to defaults).
 */
export function initRowMeta(
  ydoc: Y.Doc | null,
  rowId: string,
  init: Partial<RowMetaRecord> = {},
): void {
  if (!ydoc) return;
  const root = getRowMetaMap(ydoc);
  ydoc.transact(() => {
    if (root.has(rowId)) return; // already initialised — preserve current values
    const entry = new Y.Map();
    const full: RowMetaRecord = { ...DEFAULT_ROW_META, ...init };
    for (const [key, value] of Object.entries(full)) {
      entry.set(key, value);
    }
    root.set(rowId, entry);
  });
}

/** Remove a row's meta entry (lazy GC on row deletion). No-op if null or missing. */
export function deleteRowMeta(ydoc: Y.Doc | null, rowId: string): void {
  if (!ydoc) return;
  const root = getRowMetaMap(ydoc);
  ydoc.transact(() => {
    root.delete(rowId);
  });
}
