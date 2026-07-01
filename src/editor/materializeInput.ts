import { TextSelection } from '@tiptap/pm/state';
import type { Transaction } from '@tiptap/pm/state';
import type { Node as PMNode, Schema } from '@tiptap/pm/model';
import type { EditorView } from '@tiptap/pm/view';
import type * as Y from 'yjs';
import {
  INACTIVE,
  MATERIALIZE_THRESHOLD,
  virtualCaretKey,
  type VirtualCaretState,
} from './virtualCaret';

/**
 * Materialize-on-input — the moment the virtual caret turns into real document
 * content (free-caret-v2 Path B, ARCHITECTURE.md §A.6/§B/§C).
 *
 * When the user types (or starts an IME composition) while the virtual caret is
 * active, we convert the click-gap into a real `spacer_atom` (its width stored in
 * the Yjs side-channel) and insert the typed character right after it — all in a
 * SINGLE ProseMirror transaction, then clear the caret in the same tx. This is
 * the key difference from the old row-based ghost-park: we never park a PM
 * selection at an invalid/doc-level pos, so IME and keystrokes always land in a
 * valid inline selection.
 */

/** crypto.randomUUID with a defensive fallback (present in Tauri WebView). */
function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Insert a fresh spacer_atom of `width` px at `pos` and register its width on the
 * Yjs side-channel. Shared by materialize() (type-into-gap) and the Tab handler
 * (Session B.3) so both create spacers identically.
 *
 * Atomicity (B.1 contract): the width is written to widthMap BEFORE the caller
 * dispatches the returned transaction, so the freshly mounted NodeView reads the
 * correct width on its first render. The caller owns the single dispatch.
 */
export function insertSpacer(
  tr: Transaction,
  schema: Schema,
  widthMap: Y.Map<number>,
  pos: number,
  width: number,
): { tr: Transaction; id: string } {
  const id = newId();
  widthMap.set(id, width);
  const node = schema.nodes.spacer_atom.create({ id });
  return { tr: tr.insert(pos, node), id };
}

/**
 * Materialize the active virtual caret. `char === ''` = gap-only (IME path —
 * insert just the spacer, leave the caret at a valid pos so the browser's IME
 * composes into the real PM selection).
 */
export function materialize(
  view: EditorView,
  widthMap: Y.Map<number>,
  vcState: VirtualCaretState,
  char: string,
): void {
  const { lineDocPos, virtualXClient, textRightClient } = vcState;
  // Gap = click x − the line's content right-edge captured AT CLICK TIME. We do
  // NOT re-measure with coordsAtPos(lineDocPos) here: the caret widget (side:1)
  // renders at lineDocPos, so coordsAtPos would return the widget's x (≈ click x)
  // → gap≈0 → spacer dropped → text lands at the wrong x. (Task #10 fix.)
  const gap = Math.max(0, virtualXClient - textRightClient);

  let tr = view.state.tr;
  let insertPos = lineDocPos;
  let gapWidth = 0; // px the new spacer pushes content at lineDocPos to the right

  if (gap >= MATERIALIZE_THRESHOLD) {
    ({ tr } = insertSpacer(tr, view.state.schema, widthMap, lineDocPos, gap));
    insertPos = lineDocPos + 1; // spacer_atom nodeSize = 1
    gapWidth = gap;
  }

  if (char !== '') {
    tr = tr.insertText(char, insertPos);
    insertPos += char.length;
  }

  // Unified add-char/merge law (Session B.1): inserting a spacer + char pushes
  // ALL content at ≥lineDocPos to the right. If the line already had a spacer to
  // the right of the caret (we typed INTO a gap, e.g. left/between segments),
  // shrink it by exactly the displacement we introduced so the segment that
  // follows it stays put. When the shrink would zero the spacer out, delete it
  // (the two text runs merge naturally — no manual merge code).
  //
  // E1 [CRITICAL]: scan `tr.doc` (POST-insertion positions), never
  // `view.state.doc` — after the insert above the old spacer sits at a SHIFTED
  // pos; scanning the pre-insert doc would look at the wrong position, miss it,
  // and the neighbour would never be compensated (Case 14/15 stay red).
  const next = findNextSpacer(tr.doc, insertPos);
  if (next) {
    const displacement = gapWidth + measureCharWidth(view, char);
    tr = shrinkOrDeleteSpacer(
      tr,
      widthMap,
      next.pos,
      next.nodeSize,
      next.id,
      displacement,
    );
  }

  tr = tr.setSelection(TextSelection.near(tr.doc.resolve(insertPos)));
  tr = tr.setMeta(virtualCaretKey, INACTIVE); // clear caret in the same tx
  view.dispatch(tr);
}

/**
 * Find the FIRST spacer_atom at or after `fromPos`, restricted to the same
 * paragraph (we never displace a spacer on a different line). Takes a plain PM
 * `doc` — NOT an EditorView — so it is unit-testable without a DOM/layout.
 *
 * E4: an explicit `node.type.name === 'spacer_atom'` guard prevents
 * false-positives from other inline leaves; a paragraph with no spacer → null.
 */
export function findNextSpacer(
  doc: PMNode,
  fromPos: number,
): { pos: number; id: string; nodeSize: number } | null {
  const $from = doc.resolve(fromPos);
  // Walk up to the enclosing textblock (the paragraph) to bound the scan.
  let depth = $from.depth;
  while (depth > 0 && !$from.node(depth).isTextblock) depth -= 1;
  const paraEnd = depth > 0 ? $from.end(depth) : doc.content.size;

  let found: { pos: number; id: string; nodeSize: number } | null = null;
  doc.nodesBetween(fromPos, paraEnd, (node, pos) => {
    if (found) return false; // first match only — stop descending
    if (node.type.name === 'spacer_atom') {
      found = { pos, id: node.attrs.id as string, nodeSize: node.nodeSize };
      return false;
    }
    return true;
  });
  return found;
}

/**
 * Apply the merge law to a single neighbour spacer. Returns the (possibly
 * mutated) transaction — the caller dispatches it; this never dispatches itself
 * (atomicity contract: spacer insert + char insert + shrink/delete + caret
 * clear must all land in ONE transaction).
 *
 * - newWidth > 0  → shrink: write the reduced width to the Yjs side-channel and
 *   return `tr` untouched (the spacer node stays).
 * - newWidth ≤ 0  → merge: `tr.delete` the spacer and DO NOT call widthMap.set
 *   (E2). The node is about to be destroyed; writing its width would schedule a
 *   NodeView width-update rAF that races the node's removal.
 */
export function shrinkOrDeleteSpacer(
  tr: Transaction,
  widthMap: Y.Map<number>,
  spacerPos: number,
  nodeSize: number,
  spacerId: string,
  displacement: number,
): Transaction {
  const newWidth = (widthMap.get(spacerId) ?? 0) - displacement;
  if (newWidth > 0) {
    widthMap.set(spacerId, newWidth);
    return tr;
  }
  // newWidth ≤ 0 → merge. No widthMap.set (E2).
  return tr.delete(spacerPos, spacerPos + nodeSize);
}

/** IME entry point: materialize the gap only, leaving a valid PM selection. */
export function materializeGap(
  view: EditorView,
  widthMap: Y.Map<number>,
  vcState: VirtualCaretState,
): void {
  materialize(view, widthMap, vcState, '');
}

/**
 * Width of a single space in the editor's font, measured at runtime (proportional
 * fonts → never a magic constant). Falls back to ~7px when the font has not yet
 * loaded (measureText returns 0). Used by later phases for space-stepped nav.
 */
export function measureSpaceWidth(view: EditorView): number {
  return measureCharWidth(view, ' ');
}

/**
 * Advance-width of a single character in the editor's font, measured at runtime
 * via canvas (proportional fonts → never a magic constant). Returns 0 for the
 * empty string (the IME gap path inserts no char, so it displaces nothing).
 * Falls back to ~7px when canvas/font is unavailable (jsdom, font not loaded).
 */
export function measureCharWidth(view: EditorView, char: string): number {
  if (char === '') return 0;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return 7;
  ctx.font = getComputedStyle(view.dom).font || '16px sans-serif';
  const w = ctx.measureText(char).width;
  return w > 0 ? w : 7;
}

/** True for a single printable character keypress (no modifier chord). */
export function isPrintableKey(event: KeyboardEvent): boolean {
  return (
    event.key.length === 1 &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey
  );
}
