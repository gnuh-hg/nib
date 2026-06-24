/**
 * Ghost-caret / materialize-on-click (Phase C.2 — ARCHITECTURE.md §4/§5).
 *
 * Phase C.2 original: ghost-park (set GhostPark state, park PM selection, intercept
 * keydown to materialize). This model broke with IME/composition input:
 *   - e.key === 'Process' during composition → handleKeyDown skips materialization
 *   - parked selection at doc-level pos (doc.content.size) → "TextSelection endpoint
 *     not pointing into a node with inline content" throw → selection falls into
 *     nearest existing row → typed chars go to wrong row.
 *
 * REVISED APPROACH — materialize-on-click:
 *   When classifyClick() returns 'virtual', immediately insert an empty row at the
 *   target position (doc-order, using targetLine for blankBefore) and place a REAL
 *   PM TextSelection inside it.  The user's cursor is now in an inline-content node;
 *   all input (ASCII / IME / paste) flows naturally without any keydown interceptor.
 *
 * Empty-row cleanup (see Workspace.tsx pendingEmptyRowId): if the user clicks
 * elsewhere without typing, the empty row is deleted on next click or editor blur.
 *
 * GhostPark type + classifyClick are kept because CaretNav (Phase C.3) still
 * imports GhostPark for its arrow-navigation ghost hint.
 */

import { Selection, TextSelection } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import type { Editor } from '@tiptap/react';
import type * as Y from 'yjs';

import { RULE_HEIGHT } from '@/editor/geometry';
import { getRowMeta, patchRowMeta } from '@/lib/yRowMeta';

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Kept for CaretNav (Phase C.3 imports this type for its arrow-nav ghost hint).
 * The click-to-materialize path no longer uses ghost-park state.
 */
export interface GhostPark {
  targetLine: number;
  targetCol: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function genRowId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `row-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Find the doc-order insertion point for a new row at `targetLine`.
 *
 * Walks existing rows summing their absLine (blankBefore + 1 per row) to find
 * the first row whose absLine exceeds targetLine → insert BEFORE it.
 * Returns the PM byte-offset, the absLine of the row just before the insertion
 * point, and (for blankBefore adjustment) the successor row info.
 */
function findInsertionPoint(
  doc: ReturnType<EditorView['state']['doc']['type']['create']>,
  ydoc: Y.Doc | null,
  targetLine: number,
): {
  insertDocPos: number;
  prevAbsLine: number;
  nextRowId: string | null;
  nextRowOldAbsLine: number;
} {
  let runningLine = -1;
  let insertDocPos = doc.content.size;
  let prevAbsLine = -1;
  let nextRowId: string | null = null;
  let nextRowOldAbsLine = -1;

  for (let i = 0; i < doc.childCount; i++) {
    const row = doc.child(i);
    const rowId = row.attrs.id as string;
    const meta = getRowMeta(ydoc, rowId);
    const rowAbsLine = runningLine + 1 + meta.blankBefore;

    if (rowAbsLine > targetLine) {
      let byteOffset = 0;
      for (let k = 0; k < i; k++) byteOffset += doc.child(k).nodeSize;
      insertDocPos = byteOffset;
      nextRowId = rowId;
      nextRowOldAbsLine = rowAbsLine;
      break;
    }

    runningLine = rowAbsLine;
    prevAbsLine = rowAbsLine;
  }

  return { insertDocPos, prevAbsLine, nextRowId, nextRowOldAbsLine };
}

// ── Pure classifier (unchanged — used by handleClickOnPaper + tests) ──────────

/**
 * Pure helper — classify a click as hitting real content or virtual space.
 *
 * Exported for unit tests: pass a mocked `contentRect` (result of `coordsAtPos`)
 * and a boolean indicating whether the PM pos is at the end of its row's text.
 *
 * @param clickX            Client X of the pointer event.
 * @param clickY            Client Y of the pointer event.
 * @param contentRect       The rect returned by `view.coordsAtPos(nearestPos)`.
 * @param isAtEndOfRow      True when nearest PM pos is at/after last text char.
 * @param options.ruleHeight          Override for RULE_HEIGHT (test convenience).
 * @param options.horizontalThreshold Dead-zone (px) past rect.right before miss
 *                                    triggers (default 6px).
 */
export function classifyClick(
  clickX: number,
  clickY: number,
  contentRect: { top: number; right: number; bottom: number },
  isAtEndOfRow: boolean,
  options: { ruleHeight?: number; horizontalThreshold?: number } = {},
): 'content' | 'virtual' {
  const { ruleHeight = RULE_HEIGHT, horizontalThreshold = 6 } = options;

  const verticalMiss =
    clickY < contentRect.top - ruleHeight / 2 ||
    clickY > contentRect.bottom + ruleHeight / 2;

  const horizontalMiss =
    isAtEndOfRow && clickX > contentRect.right + horizontalThreshold;

  if (verticalMiss || horizontalMiss) return 'virtual';
  return 'content';
}

// ── Core: insert a new row and place caret inside it ─────────────────────────

/**
 * Insert an empty row at `targetLine` (doc-order) and place a valid PM
 * TextSelection inside it.  Patches rowMeta side-channel.
 *
 * @param editor           TipTap editor (schema + view).
 * @param ydoc             Yjs doc for rowMeta side-channel (null in some tests).
 * @param view             PM EditorView (for dispatch + focus).
 * @param targetLine       Absolute ruled-line index the user clicked on.
 * @param targetCol        Pixel offset from paper left edge.
 * @param onEmptyRowCreated  Called with the new row's id so the caller can
 *                           schedule cleanup if the row stays empty.
 */
export function insertRowAtLine(
  editor: Editor,
  ydoc: Y.Doc | null,
  view: EditorView,
  targetLine: number,
  targetCol: number,
  onEmptyRowCreated: (rowId: string) => void,
): void {
  const doc = view.state.doc;
  const { insertDocPos, prevAbsLine, nextRowId, nextRowOldAbsLine } =
    findInsertionPoint(doc, ydoc, targetLine);

  const blankBefore = Math.max(0, targetLine - (prevAbsLine + 1));

  const newRowId = genRowId();
  const rowNode = editor.schema.nodes.row?.create({ id: newRowId });
  if (!rowNode) return;

  // Build one transaction: insert empty row + place selection INSIDE it.
  // insertDocPos + 1 = the first inline content position of the new row.
  // Using Selection.near (not TextSelection.create) to handle the case where
  // the row content is empty — near() finds the closest valid cursor position
  // rather than throwing "no inline content at pos N".
  const tr = view.state.tr;
  tr.insert(insertDocPos, rowNode);
  try {
    tr.setSelection(Selection.near(tr.doc.resolve(insertDocPos + 1)));
  } catch {
    // If Selection.near fails (edge case), leave selection as-is.
    // The row is still inserted; user can click into it.
  }
  view.dispatch(tr);

  // Patch rowMeta AFTER dispatch (MetaSyncPlugin appendTransaction may have
  // already created DEFAULT entries — patchRowMeta overwrites with correct values).
  if (ydoc) {
    patchRowMeta(ydoc, newRowId, { blankBefore, indent: targetCol });
    // Adjust the successor row's blankBefore so its visual line stays constant.
    if (nextRowId !== null) {
      const newNextBlankBefore = Math.max(0, nextRowOldAbsLine - targetLine - 1);
      patchRowMeta(ydoc, nextRowId, { blankBefore: newNextBlankBefore });
    }
  }

  view.focus();
  onEmptyRowCreated(newRowId);
}

// ── Click handler ─────────────────────────────────────────────────────────────

/**
 * Handle a mouse/pointer click on the paper surface.
 *
 * REVISED for materialize-on-click (IME fix):
 *   - 'virtual' click (empty space, doc empty, below content) → call
 *     `insertRowAtLine` which creates a row with a VALID inline TextSelection.
 *     Any subsequent input (ASCII, IME/composition, paste) goes directly into
 *     the row without any keydown interceptor.
 *   - 'content' click (on existing text) → set PM selection to `posAtClick.pos`
 *     (already an inline pos inside a row — safe for TextSelection).
 *
 * No ghost-park state is set; the TextSelection endpoint error is eliminated
 * because we never park selection at a doc-level position.
 *
 * @param view             PM EditorView.
 * @param editor           TipTap editor (needed to create row nodes).
 * @param ydoc             Yjs doc for rowMeta (may be null in tests).
 * @param clientX/Y        Pointer event coordinates.
 * @param paperRect        Bounding rect of the paper element.
 * @param onEmptyRowCreated  Callback with new row id (for empty-row cleanup).
 */
export function handleClickOnPaper(
  view: EditorView,
  editor: Editor,
  ydoc: Y.Doc | null,
  clientX: number,
  clientY: number,
  paperRect: Pick<DOMRect, 'top' | 'left'>,
  onEmptyRowCreated: (rowId: string) => void,
): void {
  const doc = view.state.doc;
  const relY = clientY - paperRect.top;
  const relX = clientX - paperRect.left;
  const targetLine = Math.floor(relY / RULE_HEIGHT);
  const targetCol = Math.max(0, relX);

  const posAtClick = view.posAtCoords({ left: clientX, top: clientY });

  // Empty doc or null posAtClick → materialize immediately.
  if (posAtClick === null || doc.content.size === 0) {
    insertRowAtLine(editor, ydoc, view, targetLine, targetCol, onEmptyRowCreated);
    return;
  }

  // PM returned nearest pos. Classify the click.
  let contentRect: { top: number; right: number; bottom: number };
  let isAtEndOfRow: boolean;
  try {
    contentRect = view.coordsAtPos(posAtClick.pos);
    const $pos = doc.resolve(posAtClick.pos);
    isAtEndOfRow = $pos.parentOffset >= $pos.parent.content.size;
  } catch {
    // coordsAtPos requires layout; if it fails fall back to materialize.
    insertRowAtLine(editor, ydoc, view, targetLine, targetCol, onEmptyRowCreated);
    return;
  }

  const kind = classifyClick(clientX, clientY, contentRect, isAtEndOfRow);

  if (kind === 'virtual') {
    insertRowAtLine(editor, ydoc, view, targetLine, targetCol, onEmptyRowCreated);
  } else {
    // Content click: posAtClick.pos is inside an existing row → valid inline pos.
    try {
      view.dispatch(
        view.state.tr.setSelection(TextSelection.create(doc, posAtClick.pos)),
      );
    } catch { /* defensive */ }
    view.focus();
  }
}
