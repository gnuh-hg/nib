import { TextSelection } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import type * as Y from 'yjs';
import {
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

const INACTIVE: VirtualCaretState = {
  active: false,
  lineDocPos: 0,
  virtualXEditorRelative: 0,
  virtualXClient: 0,
  textRightClient: 0,
};

/** crypto.randomUUID with a defensive fallback (present in Tauri WebView). */
function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
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

  if (gap >= MATERIALIZE_THRESHOLD) {
    const id = newId();
    // Width set on the Yjs side-channel BEFORE dispatch so the freshly created
    // NodeView reads the correct initial width on first render.
    widthMap.set(id, gap);
    const spacerNode = view.state.schema.nodes.spacer_atom.create({ id });
    tr = tr.insert(lineDocPos, spacerNode);
    insertPos = lineDocPos + 1; // spacer_atom nodeSize = 1
  }

  if (char !== '') {
    tr = tr.insertText(char, insertPos);
    insertPos += char.length;
  }

  tr = tr.setSelection(TextSelection.near(tr.doc.resolve(insertPos)));
  tr = tr.setMeta(virtualCaretKey, INACTIVE); // clear caret in the same tx
  view.dispatch(tr);
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
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return 7;
  ctx.font = getComputedStyle(view.dom).font || '16px sans-serif';
  const w = ctx.measureText(' ').width;
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
