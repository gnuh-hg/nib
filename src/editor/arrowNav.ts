import { TextSelection } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import { findNextSpacer, measureSpaceWidth } from './materializeInput';
import {
  INACTIVE,
  MATERIALIZE_THRESHOLD,
  virtualCaretKey,
  type VirtualCaretState,
} from './virtualCaret';

/**
 * Arrow-key navigation for free-caret-v2 (Session B.2). Two axes:
 *
 *  - Horizontal: step the virtual caret left/right by one space-width while it
 *    lives in a gap, crossing into / out of spacer atoms at their pixel
 *    boundaries. Outside a gap, an arrow that walks INTO a spacer re-activates
 *    the virtual caret at the spacer edge; otherwise ProseMirror's default
 *    char-by-char motion takes over.
 *
 *  - Vertical: move to the line above/below while preserving the "goal X" column
 *    (IntelliJ / VS Code behaviour) — so walking Down through a short line and
 *    back keeps the original column.
 *
 * goalX MUST survive a deactivated caret (Down into a text line, then Down again
 * keeps the column), so it lives as a MODULE-level ref — NOT inside
 * VirtualCaretState, which is reset to INACTIVE whenever the caret leaves a gap.
 */

/** E1: subpixel slack so the caret never sticks one fraction shy of a boundary. */
const EXIT_EPSILON = 0.5;

let _goalX: number | null = null;
/** Current goal column (px, client X) for vertical motion, or null if unset. */
export function getGoalX(): number | null {
  return _goalX;
}
export function setGoalX(x: number): void {
  _goalX = x;
}
/** Clear the goal column — called on every horizontal move / type / click. */
export function resetGoalX(): void {
  _goalX = null;
}

function viewLeftOf(view: EditorView): number {
  return view.dom.getBoundingClientRect().left;
}

// ── Horizontal ──────────────────────────────────────────────────────────────

/**
 * Handle ArrowLeft/ArrowRight. Returns true when we consumed the key (caller
 * must `return true` so ProseMirror does not ALSO move its own selection); false
 * lets PM perform its default char motion.
 */
export function tryMoveHorizontal(
  view: EditorView,
  vc: VirtualCaretState,
  dir: 'left' | 'right',
): boolean {
  if (vc.active) {
    moveHorizontalInGap(view, vc, dir);
    return true;
  }

  const { selection } = view.state;
  if (!selection.empty) return false;
  const $anchor = selection.$anchor;

  if (dir === 'right') {
    if ($anchor.nodeAfter?.type.name === 'spacer_atom') {
      enterSpacerFromLeft(view, selection.from);
      return true;
    }
    return false;
  }
  // left
  const before = $anchor.nodeBefore;
  if (before?.type.name === 'spacer_atom') {
    enterSpacerFromRight(view, selection.from - before.nodeSize);
    return true;
  }
  return false;
}

/** Step the active caret one space-width inside its gap, exiting at boundaries. */
function moveHorizontalInGap(
  view: EditorView,
  vc: VirtualCaretState,
  dir: 'left' | 'right',
): void {
  const spaceW = measureSpaceWidth(view);
  const newVX =
    dir === 'right' ? vc.virtualXClient + spaceW : vc.virtualXClient - spaceW;
  const viewLeft = viewLeftOf(view);

  // E5: this branch does NOT insert anything, so read the LIVE document
  // (view.state.doc) — unlike B.1 materialize(), which scans tr.doc after an
  // insert shifts positions. lineDocPos is a valid inline pos; the gap's spacer
  // (when present) sits immediately to its right.
  const spacer = findNextSpacer(view.state.doc, vc.lineDocPos);

  if (spacer && spacer.pos >= 1) {
    const spacerLeftX = view.coordsAtPos(spacer.pos).left;
    const spacerRightX = view.coordsAtPos(spacer.pos + spacer.nodeSize).left;

    if (newVX >= spacerRightX - EXIT_EPSILON) {
      // Exit RIGHT → real PM selection just after the spacer.
      const pos = spacer.pos + spacer.nodeSize;
      view.dispatch(
        view.state.tr
          .setSelection(TextSelection.near(view.state.doc.resolve(pos)))
          .setMeta(virtualCaretKey, INACTIVE),
      );
      return;
    }
    if (newVX <= spacerLeftX + EXIT_EPSILON) {
      // Exit LEFT → PM selection at the gap's left boundary (lineDocPos).
      view.dispatch(
        view.state.tr
          .setSelection(TextSelection.near(view.state.doc.resolve(vc.lineDocPos)))
          .setMeta(virtualCaretKey, INACTIVE),
      );
      return;
    }
    // Stay inside the gap — just move the caret.
    view.dispatch(
      view.state.tr.setMeta(virtualCaretKey, {
        ...vc,
        virtualXClient: newVX,
        virtualXEditorRelative: newVX - viewLeft,
      }),
    );
    return;
  }

  // No spacer → a free gap past the line's content-right. Only the LEFT side is
  // bounded (back to text-right); rightward the gap is effectively infinite.
  if (dir === 'left' && newVX <= vc.textRightClient) {
    view.dispatch(
      view.state.tr
        .setSelection(TextSelection.near(view.state.doc.resolve(vc.lineDocPos)))
        .setMeta(virtualCaretKey, INACTIVE),
    );
    return;
  }
  view.dispatch(
    view.state.tr.setMeta(virtualCaretKey, {
      ...vc,
      virtualXClient: newVX,
      virtualXEditorRelative: newVX - viewLeft,
    }),
  );
}

/** Activate the caret on the LEFT edge of a spacer (arrow walked in from text). */
function enterSpacerFromLeft(view: EditorView, spacerPos: number): void {
  if (spacerPos < 1) return; // E3
  const spaceW = measureSpaceWidth(view);
  const spacerLeftX = view.coordsAtPos(spacerPos).left;
  const virtualXClient = spacerLeftX + spaceW;
  view.dispatch(
    view.state.tr.setMeta(virtualCaretKey, {
      active: true,
      // lineDocPos = the spacer's left boundary so findNextSpacer re-locates it.
      lineDocPos: spacerPos,
      virtualXClient,
      virtualXEditorRelative: virtualXClient - viewLeftOf(view),
      textRightClient: spacerLeftX,
    } satisfies VirtualCaretState),
  );
}

/** Activate the caret on the RIGHT edge of a spacer (arrow walked in from text). */
function enterSpacerFromRight(view: EditorView, spacerPos: number): void {
  if (spacerPos < 1) return; // E3
  const spaceW = measureSpaceWidth(view);
  const spacerRightX = view.coordsAtPos(spacerPos + 1).left;
  const spacerLeftX = view.coordsAtPos(spacerPos).left;
  const virtualXClient = spacerRightX - spaceW;
  view.dispatch(
    view.state.tr.setMeta(virtualCaretKey, {
      active: true,
      // lineDocPos is ALWAYS the spacer's left boundary (gap origin).
      lineDocPos: spacerPos,
      virtualXClient,
      virtualXEditorRelative: virtualXClient - viewLeftOf(view),
      textRightClient: spacerLeftX,
    } satisfies VirtualCaretState),
  );
}

// ── Vertical ────────────────────────────────────────────────────────────────

/** The column to aim for when there is no remembered goalX yet. */
function computeCurrentGoalX(view: EditorView, vc: VirtualCaretState): number {
  if (vc.active) return vc.virtualXClient;
  return view.coordsAtPos(view.state.selection.from).left;
}

/**
 * Handle ArrowUp/ArrowDown. Always intercepts (returns true) when it can compute
 * a target line so the goalX column is honoured; returns false only when there
 * is no adjacent line (PM default / no-op) — goalX is left set so a subsequent
 * press still preserves the column.
 */
export function tryMoveVertical(
  view: EditorView,
  vc: VirtualCaretState,
  dir: 'up' | 'down',
): boolean {
  const gX = getGoalX() ?? computeCurrentGoalX(view, vc);
  setGoalX(gX);

  const currentPos = vc.active ? vc.lineDocPos : view.state.selection.from;
  if (currentPos < 1) return false; // E3
  const coords = view.coordsAtPos(currentPos);

  // E2: step into the next line using THIS line's pixel box (DPR/zoom-safe),
  // never a fixed RULE_HEIGHT constant which scaling would make miss.
  const newLineY = dir === 'down' ? coords.bottom + 2 : coords.top - 2;

  const result = view.posAtCoords({ left: gX, top: newLineY });
  if (!result || result.pos < 1) return false; // no line there; goalX preserved

  const targetCoords = view.coordsAtPos(result.pos);
  const viewLeft = viewLeftOf(view);

  if (gX > targetCoords.right + MATERIALIZE_THRESHOLD) {
    // Goal column lands in a GAP on the new line → re-activate the caret there.
    view.dispatch(
      view.state.tr
        .setSelection(TextSelection.near(view.state.doc.resolve(result.pos)))
        .setMeta(virtualCaretKey, {
          active: true,
          lineDocPos: result.pos,
          virtualXClient: gX,
          virtualXEditorRelative: gX - viewLeft,
          textRightClient: targetCoords.right,
        } satisfies VirtualCaretState),
    );
    return true;
  }

  // Goal column lands within text on the new line → plain PM selection.
  let tr = view.state.tr.setSelection(
    TextSelection.near(view.state.doc.resolve(result.pos)),
  );
  if (vc.active) tr = tr.setMeta(virtualCaretKey, INACTIVE);
  view.dispatch(tr);
  return true;
}
