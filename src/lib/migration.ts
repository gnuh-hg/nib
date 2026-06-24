// Migration module — Phase B.3 (free-caret rebuild).
//
// Safely converts old `nibBlock*` schema documents to the new `row*` schema
// (ARCHITECTURE.md §3). The golden rule: NEVER delete the old IDB store.
// Old data is preserved as a backup; the migrated copy lives in a suffixed store.
//
// HARD CONSTRAINT: indexedDB.deleteDatabase is NEVER called. Any path that would
// destroy the old store is a critical bug. This is enforced by the test spy.

import * as Y from 'yjs';
import { getSchema } from '@tiptap/core';
import { prosemirrorJSONToYDoc } from 'y-prosemirror';
import { IndexeddbPersistence } from 'y-indexeddb';

import { NibDocument } from '@/editor/extensions/NibDocument';
import { NibText } from '@/editor/extensions/NibText';
import { Row } from '@/editor/extensions/Row';
import { MathInline } from '@/editor/extensions/MathInline';
import {
  NibBold,
  NibItalic,
  NibUnderline,
  NibStrike,
} from '@/editor/extensions/marks';

import {
  PROSEMIRROR_FRAGMENT,
  getBlockMetaMap,
} from '@/lib/yjs';
import { idbStoreName, waitForSync } from '@/lib/yPersistence';
import { initBlockMeta } from '@/editor/yBlockMeta';
import { initRowMeta } from '@/lib/yRowMeta';
import type { BlockState, ErrorKind, MathSize } from '@/types/block';

// ── Schema ──────────────────────────────────────────────────────────────────

/** Build the v2 PM Schema once (lazy singleton). */
let _v2Schema: ReturnType<typeof getSchema> | null = null;
function getV2Schema() {
  if (!_v2Schema) {
    _v2Schema = getSchema([
      NibDocument,
      NibText,
      Row,
      MathInline,
      NibBold,
      NibItalic,
      NibUnderline,
      NibStrike,
    ]);
  }
  return _v2Schema;
}

// ── Types ────────────────────────────────────────────────────────────────────

export type SchemaVersion = 'v2' | 'empty-new' | 'old-data' | 'unknown';

export interface MigrationResult {
  status: 'v2-existing' | 'empty-stamped' | 'migrated' | 'fallback';
  /** The migrated Y.Doc, present when status='migrated'. Use this as the editor doc. */
  newDoc?: Y.Doc;
  error?: string;
}

interface OldBlockData {
  id: string;
  blockType: 'math' | 'text' | 'ink';
  starter: boolean;
  xOffset: number;
  lineIndex: number;
  textContent: string;
  // CAS fields from old blockMeta (xOffset/lineIndex not carried over)
  latexContent: string;
  blockState: string;
  exactLatex: string;
  approxLatex: string;
  isApprox: boolean;
  errorKind: string;
  mathSize: string;
  color: string;
  inkStrokes: string;
}

// ── Detection ─────────────────────────────────────────────────────────────────

/**
 * Inspect a Y.Doc loaded from IDB and classify its schema state.
 * Must be called AFTER waitForSync so the doc is fully hydrated.
 *
 * Returns:
 *   'v2'        — already using new row-based schema.
 *   'empty-new' — doc has no content and no schemaVersion; safe to stamp v2.
 *   'old-data'  — has nibBlock XML nodes or old blockMeta entries → needs migration.
 *   'unknown'   — non-empty but no recognized structure (leave alone).
 */
export function detectSchemaVersion(ydoc: Y.Doc): SchemaVersion {
  const docMeta = ydoc.getMap<unknown>('docMeta');
  const version = docMeta.get('schemaVersion');
  if (version === 2) return 'v2';

  const frag = ydoc.getXmlFragment(PROSEMIRROR_FRAGMENT);
  const blockMeta = getBlockMetaMap(ydoc);

  // Scan top-level XmlFragment children for nibBlock nodes.
  let hasNibBlock = false;
  for (let i = 0; i < frag.length; i++) {
    const child = frag.get(i);
    if (child instanceof Y.XmlElement && child.nodeName === 'nibBlock') {
      hasNibBlock = true;
      break;
    }
  }

  if (hasNibBlock || blockMeta.size > 0) return 'old-data';
  if (frag.length === 0 && blockMeta.size === 0) return 'empty-new';
  return 'unknown';
}

// ── Conversion ───────────────────────────────────────────────────────────────

/** Extract plain text from a Y.XmlElement's XmlText children. */
function extractXmlText(el: Y.XmlElement): string {
  let text = '';
  for (let j = 0; j < el.length; j++) {
    const child = el.get(j);
    if (child instanceof Y.XmlText) text += child.toJSON();
  }
  return text;
}

/**
 * Read old nibBlock data from the Y.Doc's XmlFragment and blockMeta.
 * Throws if an unexpected node is encountered (triggers C4 fallback).
 *
 * Exported for unit testing.
 */
export function _readOldBlocks(ydoc: Y.Doc): OldBlockData[] {
  const frag = ydoc.getXmlFragment(PROSEMIRROR_FRAGMENT);
  const blockMetaMap = getBlockMetaMap(ydoc);
  const blocks: OldBlockData[] = [];

  for (let i = 0; i < frag.length; i++) {
    const child = frag.get(i);
    if (!(child instanceof Y.XmlElement) || child.nodeName !== 'nibBlock') {
      throw new Error(
        `Unexpected node in old schema at index ${i}: ` +
          (child instanceof Y.XmlElement ? child.nodeName : typeof child),
      );
    }

    const id = child.getAttribute('id') ?? `block-${i}`;
    const blockType = (child.getAttribute('blockType') ?? 'math') as OldBlockData['blockType'];
    const starter = child.getAttribute('starter') === 'true';
    const textContent = extractXmlText(child);

    // Read old blockMeta directly (raw Y.Map — new BlockMetaRecord no longer has xOffset/lineIndex)
    const oldEntry = blockMetaMap.get(id) as Y.Map<unknown> | undefined;
    const g = <T>(key: string, def: T): T => {
      const v = oldEntry?.get(key);
      return (v === undefined ? def : v) as T;
    };

    blocks.push({
      id,
      blockType,
      starter,
      xOffset: g('xOffset', 0),
      lineIndex: g('lineIndex', 0),
      textContent,
      latexContent: g('latexContent', ''),
      blockState: g('blockState', 'editing-math'),
      exactLatex: g('exactLatex', ''),
      approxLatex: g('approxLatex', ''),
      isApprox: g('isApprox', false),
      errorKind: g('errorKind', ''),
      mathSize: g('mathSize', 'normal'),
      color: g('color', ''),
      inkStrokes: g('inkStrokes', '[]'),
    });
  }

  return blocks;
}

/**
 * Convert old nibBlock blocks to a new Y.Doc with row/mathInline schema.
 * 1 nibBlock → 1 row. Sort by (lineIndex asc, xOffset asc).
 * Sets rowMeta + blockMeta on newDoc.
 *
 * Exported for unit testing.
 */
export function _convertOldDocToNew(ydoc: Y.Doc): { newDoc: Y.Doc; blocks: OldBlockData[] } {
  const blocks = _readOldBlocks(ydoc);

  // Sort by reading order: top→bottom, left→right.
  blocks.sort((a, b) => a.lineIndex - b.lineIndex || a.xOffset - b.xOffset);

  // Build PM JSON for new schema.
  const pmRows: object[] = [];
  for (const block of blocks) {
    const rowId = `migrated-row-${block.id}`;
    let rowContent: object[] | undefined;

    if (block.blockType === 'math' || block.blockType === 'ink') {
      rowContent = [{ type: 'mathInline', attrs: { id: block.id } }];
    } else if (block.blockType === 'text' && block.textContent) {
      rowContent = [{ type: 'text', text: block.textContent }];
    }

    const row: Record<string, unknown> = { type: 'row', attrs: { id: rowId } };
    if (rowContent) row.content = rowContent;
    pmRows.push(row);
  }

  const pmJson = { type: 'doc', content: pmRows };

  // Build newDoc: prosemirrorJSONToYDoc creates a Y.Doc with the XmlFragment populated.
  const newDoc = prosemirrorJSONToYDoc(getV2Schema(), pmJson, PROSEMIRROR_FRAGMENT);

  // Set rowMeta + blockMeta on newDoc.
  let prevLine = 0;
  for (let idx = 0; idx < blocks.length; idx++) {
    const block = blocks[idx];
    const rowId = `migrated-row-${block.id}`;

    // blankBefore = number of blank ruled-lines above this row.
    // First block: blankBefore = its lineIndex (all lines above are blank).
    // Subsequent blocks: gap between this line and the previous one.
    const blankBefore =
      idx === 0
        ? block.lineIndex
        : Math.max(0, block.lineIndex - prevLine - 1);
    prevLine = block.lineIndex;

    initRowMeta(newDoc, rowId, { blankBefore, indent: block.xOffset });

    if (block.blockType === 'math' || block.blockType === 'ink') {
      initBlockMeta(newDoc, block.id, {
        latexContent: block.latexContent,
        blockState: block.blockState as BlockState,
        exactLatex: block.exactLatex,
        approxLatex: block.approxLatex,
        isApprox: block.isApprox,
        errorKind: block.errorKind as ErrorKind,
        mathSize: block.mathSize as MathSize,
        color: block.color,
        inkStrokes: block.inkStrokes,
      });
    }
  }

  // Stamp schema version.
  newDoc.getMap<unknown>('docMeta').set('schemaVersion', 2);

  return { newDoc, blocks };
}

/** Verify the migrated newDoc matches the old doc's block count + sample CAS data. */
function _verifyMigration(blocks: OldBlockData[], newDoc: Y.Doc): boolean {
  const newFrag = newDoc.getXmlFragment(PROSEMIRROR_FRAGMENT);
  const newBlockMeta = getBlockMetaMap(newDoc);

  // Row count must match block count.
  if (newFrag.length !== blocks.length) return false;

  // BlockMeta count must match math/ink block count.
  const mathCount = blocks.filter((b) => b.blockType === 'math' || b.blockType === 'ink').length;
  if (newBlockMeta.size !== mathCount) return false;

  // Sample: first math block's latexContent must match.
  const firstMath = blocks.find((b) => b.blockType === 'math');
  if (firstMath) {
    const newMeta = newBlockMeta.get(firstMath.id) as Y.Map<unknown> | undefined;
    if (!newMeta) return false;
    if (newMeta.get('latexContent') !== firstMath.latexContent) return false;
  }

  return true;
}

/** Persist a Y.Doc to a new IDB store by applying its state to a fresh doc. */
async function _persistToV2Store(newDoc: Y.Doc, v2StoreName: string): Promise<void> {
  // y-indexeddb saves future updates from its attached doc.
  // To write the EXISTING newDoc state, apply it to a fresh doc that the persistence watches.
  const freshDoc = new Y.Doc();
  const v2Persistence = new IndexeddbPersistence(v2StoreName, freshDoc);
  await waitForSync(v2Persistence); // loads nothing (new empty store)
  // Apply the migrated state — triggers persistence 'update' handler → writes to IDB.
  Y.applyUpdate(freshDoc, Y.encodeStateAsUpdate(newDoc));
  // Brief async tick to let IDB write complete.
  await new Promise<void>((r) => setTimeout(r, 0));
  await v2Persistence.destroy();
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Check the loaded ydoc and migrate if needed.
 *
 * Must be called AFTER waitForSync (ydoc is hydrated from local IDB).
 * Must be called BEFORE the TipTap editor binds to the ydoc.
 *
 * @returns
 *   - 'v2-existing' — already on new schema, no action.
 *   - 'empty-stamped' — was empty, stamped schemaVersion=2, no conversion.
 *   - 'migrated'    — converted to row/mathInline; newDoc has the result.
 *                     Caller should use `result.newDoc` for the editor.
 *   - 'fallback'    — conversion or verification failed; old data preserved,
 *                     editor should open with an empty doc and show notice.
 *
 * NEVER calls indexedDB.deleteDatabase — old store is always preserved.
 */
export async function migrateIfNeeded(
  ydoc: Y.Doc,
  docId: string,
  userId: string,
): Promise<MigrationResult> {
  const version = detectSchemaVersion(ydoc);

  // Already on new schema — nothing to do.
  if (version === 'v2') return { status: 'v2-existing' };

  // Empty doc: just stamp the version so future loads skip detection.
  if (version === 'empty-new') {
    ydoc.getMap<unknown>('docMeta').set('schemaVersion', 2);
    return { status: 'empty-stamped' };
  }

  // Unknown schema (content but not nibBlock, no schemaVersion): safe to skip.
  if (version !== 'old-data') {
    return { status: 'fallback', error: `Unrecognised schema state: ${version}` };
  }

  // CONVERT path.
  try {
    const { newDoc, blocks } = _convertOldDocToNew(ydoc);

    // Verify the migration before committing.
    if (!_verifyMigration(blocks, newDoc)) {
      return { status: 'fallback', error: 'Verification failed: row/blockMeta counts do not match' };
    }

    // Persist to a NEW IDB store (old store untouched = backup).
    if (typeof indexedDB !== 'undefined') {
      const oldStoreName = idbStoreName(docId, userId);
      const v2StoreName = `${oldStoreName}__v2`;
      await _persistToV2Store(newDoc, v2StoreName);
      // Registry flag: next load will use v2 store directly.
      localStorage.setItem(`nib-migrated-v2:${oldStoreName}`, '1');
    }

    return { status: 'migrated', newDoc };
  } catch (err) {
    // Any error → fallback. Old store is untouched.
    return { status: 'fallback', error: String(err) };
  }
}
