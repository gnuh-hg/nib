import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { EditorState } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';

/**
 * Virtual caret — the ephemeral "click anywhere on a line" cursor of
 * free-caret-v2 (Path B, ARCHITECTURE.md §A.5/§B/§C).
 *
 * When the user clicks past the end of a line's content, ProseMirror still sets a
 * VALID TextSelection at the nearest inline pos; on top of that we light up a
 * decoration-only blinking caret at the clicked x. The plugin holds nothing but
 * ephemeral UI state — it is NEVER persisted to Yjs. The actual whitespace is
 * only materialized when the user types (Session A.3).
 *
 * The single most important invariant (E1) lives in `apply`: the state is reset
 * ONLY by a transaction that carries our meta. A remote Yjs sync transaction (no
 * meta) must leave the caret untouched — otherwise the caret would blink off the
 * moment a collaborator edits, which is exactly how the old row-based ghost-park
 * mechanism broke.
 */

/** Distance (px) past a line's content-right before we treat a click as a gap. */
export const MATERIALIZE_THRESHOLD = 4;

export interface VirtualCaretState {
  active: boolean;
  /** Valid PM pos (nearest inline pos on the clicked line). */
  lineDocPos: number;
  /** clientX − view.dom left — where the caret span is drawn inside the line. */
  virtualXEditorRelative: number;
  /** Raw event.clientX — used to compute the gap when materializing (A.3). */
  virtualXClient: number;
  /**
   * The line's content right-edge in client px, measured AT CLICK TIME (before
   * the caret widget renders). materialize() uses this to compute the gap —
   * re-measuring later via coordsAtPos(lineDocPos) would return the widget's
   * coords (side:1 widget sits at lineDocPos) instead of the text-right, giving
   * gap≈0 and dropping the spacer. (Task #10 fix.)
   */
  textRightClient: number;
}

const INACTIVE: VirtualCaretState = {
  active: false,
  lineDocPos: 0,
  virtualXEditorRelative: 0,
  virtualXClient: 0,
  textRightClient: 0,
};

export const virtualCaretKey = new PluginKey<VirtualCaretState>('nib-virtual-caret');

/** Read the current virtual-caret state from an editor state. */
export function getVirtualCaret(state: EditorState): VirtualCaretState {
  return virtualCaretKey.getState(state) ?? INACTIVE;
}

/**
 * Activate the virtual caret at `pos`, drawn at `xRel` (editor-relative px).
 * `xClient` is the raw clientX kept for the A.3 gap computation; `textRightClient`
 * is the line's content right-edge measured now, at click time (Task #10).
 */
export function setVirtualCaret(
  view: EditorView,
  pos: number,
  xRel: number,
  xClient: number,
  textRightClient: number,
): void {
  const next: VirtualCaretState = {
    active: true,
    lineDocPos: pos,
    virtualXEditorRelative: xRel,
    virtualXClient: xClient,
    textRightClient,
  };
  view.dispatch(view.state.tr.setMeta(virtualCaretKey, next));
}

/** Deactivate the virtual caret (decoration disappears next render). */
export function clearVirtualCaret(view: EditorView): void {
  view.dispatch(view.state.tr.setMeta(virtualCaretKey, INACTIVE));
}

export function createVirtualCaretPlugin(): Plugin<VirtualCaretState> {
  return new Plugin<VirtualCaretState>({
    key: virtualCaretKey,
    state: {
      init() {
        return INACTIVE;
      },
      // E1 (highest risk): only a transaction that explicitly carries our meta
      // may change the state. `tr.getMeta(...) ?? prev` keeps the caret intact
      // through every other transaction — crucially the remote Yjs sync tx,
      // which would otherwise clobber the caret to INACTIVE.
      apply(tr, prev) {
        return tr.getMeta(virtualCaretKey) ?? prev;
      },
    },
    props: {
      decorations(state) {
        const vc = this.getState(state);
        if (!vc || !vc.active) return DecorationSet.empty;
        const widget = Decoration.widget(
          vc.lineDocPos,
          () => {
            const span = document.createElement('span');
            span.className = 'nib-vcaret';
            span.style.left = `${vc.virtualXEditorRelative}px`;
            return span;
          },
          { side: 1, key: 'nib-vcaret' },
        );
        return DecorationSet.create(state.doc, [widget]);
      },
    },
  });
}
