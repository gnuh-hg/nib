/**
 * Arrow-Nav 2D + Tab navigation plugin (Phase C.3 — ARCHITECTURE.md §6).
 *
 * Implements:
 *   ArrowUp / ArrowDown — 2D navigation with goalX preservation across rows.
 *   Tab / Shift-Tab     — jump to next / previous mathInline atom.
 *   ArrowLeft / Right   — reset goalX (then let PM handle natively).
 *
 * goalX is stored in extension storage (mutable, no PM plugin state overhead).
 * Ghost-park on empty lines: same mechanism as ghostCaret.ts click handler.
 *
 * Left/Right through mathInline (atom:true): PM default already handles this
 * correctly — atom:true means nodeSize=1, so PM treats it as 1 unit. No extra
 * keymap needed; verified by test.
 *
 * Phase C.3 decision (ArrowDown at doc end): no-op / park ghost on next line.
 * We currently set ghost-park when posAtCoords returns null — this covers both
 * "empty line between rows" and "past last row". Documented in CHECKPOINT.
 */

import { Extension } from '@tiptap/core';
import { TextSelection, NodeSelection } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';

import { RULE_HEIGHT } from '@/editor/geometry';
import type { GhostPark } from '@/editor/plugins/ghostCaret';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CaretNavOptions {
  /** Callback to set ghost-park state in Workspace (React state, not Y.Doc). */
  setGhostPark: (park: GhostPark | null) => void;
}

interface CaretNavStorage {
  /**
   * Target x-coordinate (viewport px) preserved across consecutive ArrowUp/Down.
   * Null when not in a vertical navigation sequence.
   */
  goalX: number | null;
}

// ── Vertical navigation helper (exported for unit tests) ──────────────────────

/**
 * Handle ArrowUp or ArrowDown with goalX preservation.
 *
 * @param view        PM EditorView (coordsAtPos/posAtCoords/dispatch).
 * @param direction   'up' | 'down'.
 * @param goalX       The preserved x column from the plugin storage (null = use current head).
 * @param setGhostPark  Callback for empty-line virtual parking.
 * @returns { handled, newGoalX }
 *   handled=true → caller should return true from keymap (prevent default).
 *   newGoalX     → caller should update storage.goalX with this value.
 */
export function handleVerticalNav(
  view: EditorView,
  direction: 'up' | 'down',
  goalX: number | null,
  setGhostPark: (park: GhostPark | null) => void,
): { handled: boolean; newGoalX: number | null } {
  const { selection } = view.state;

  // Get current cursor coordinates.
  let coords: { left: number; top: number; bottom: number } | null = null;
  try {
    coords = view.coordsAtPos(selection.head);
  } catch {
    return { handled: false, newGoalX: goalX };
  }
  if (!coords) return { handled: false, newGoalX: goalX };

  // goalX = sticky column across up/down; falls back to current x on first move.
  const curX = goalX ?? coords.left;

  // Compute the target y one ruled-line above or below the current row.
  let targetY: number;
  if (direction === 'up') {
    targetY = coords.top - RULE_HEIGHT;
    if (targetY < 0) {
      // Already at the first line — move to document start (pos 0).
      try {
        view.dispatch(
          view.state.tr.setSelection(TextSelection.create(view.state.doc, 0)),
        );
      } catch { /* ignore */ }
      return { handled: true, newGoalX: null }; // reset goalX at doc boundary
    }
  } else {
    targetY = coords.bottom + RULE_HEIGHT;
  }

  // Try to find a valid PM position at the target column + row.
  const posAtTarget = view.posAtCoords({ left: curX, top: targetY });

  if (posAtTarget !== null) {
    // Hit real content → set selection there.
    try {
      view.dispatch(
        view.state.tr.setSelection(
          TextSelection.create(view.state.doc, posAtTarget.pos),
        ),
      );
    } catch {
      return { handled: false, newGoalX: goalX };
    }
    return { handled: true, newGoalX: curX }; // preserve goalX for next move
  }

  // Empty space — park the ghost caret at the target line.
  // curLine is approximate (viewport coords ÷ RULE_HEIGHT).
  const curLine = Math.max(0, Math.round(coords.top / RULE_HEIGHT));
  const targetLine =
    direction === 'up' ? Math.max(0, curLine - 1) : curLine + 1;
  setGhostPark({ targetLine, targetCol: curX });

  // Park PM selection at the nearest real position (end of doc).
  const endPos = view.state.doc.content.size;
  try {
    view.dispatch(
      view.state.tr.setSelection(
        TextSelection.create(view.state.doc, endPos > 0 ? endPos : 0),
      ),
    );
  } catch { /* ignore */ }

  return { handled: true, newGoalX: curX };
}

// ── Tab navigation helper (exported for unit tests) ───────────────────────────

/**
 * Handle Tab (forward) / Shift-Tab (backward): jump to the next or previous
 * mathInline atom in the document.
 *
 * Searches ALL atoms in doc order, jumps to the one just after (Tab) or just
 * before (Shift-Tab) the current selection head.
 *
 * @returns true if an atom was found and selected (handled); false otherwise.
 */
export function handleTab(view: EditorView, shiftKey: boolean): boolean {
  const { selection, doc } = view.state;
  const pos = selection.head;

  // Collect all mathInline positions in document order.
  const atoms: number[] = [];
  doc.descendants((node, nodePos) => {
    if (node.type.name === 'mathInline') atoms.push(nodePos);
    return true;
  });

  if (atoms.length === 0) return false;

  if (!shiftKey) {
    // Tab → first atom STRICTLY after current pos.
    const nextAtomPos = atoms.find((p) => p > pos);
    if (nextAtomPos !== undefined) {
      try {
        view.dispatch(
          view.state.tr.setSelection(NodeSelection.create(doc, nextAtomPos)),
        );
      } catch {
        return false;
      }
      return true;
    }
  } else {
    // Shift-Tab → last atom STRICTLY before current pos.
    const prevAtomPos = [...atoms].reverse().find((p) => p < pos);
    if (prevAtomPos !== undefined) {
      try {
        view.dispatch(
          view.state.tr.setSelection(NodeSelection.create(doc, prevAtomPos)),
        );
      } catch {
        return false;
      }
      return true;
    }
  }

  return false; // no atom found → let default Tab handle (indent / focus move)
}

// ── TipTap Extension ──────────────────────────────────────────────────────────

/**
 * CaretNav — keymap extension for 2D arrow navigation + Tab atom-jump.
 *
 * Configure in Workspace.tsx:
 *   `CaretNav.configure({ setGhostPark })`
 *
 * Storage: `editor.storage.caretNav.goalX` (number | null) — can be reset from
 * outside (e.g., on paper click in Workspace.tsx).
 */
export const CaretNav = Extension.create<CaretNavOptions, CaretNavStorage>({
  name: 'caretNav',

  addOptions(): CaretNavOptions {
    return { setGhostPark: () => {} };
  },

  addStorage(): CaretNavStorage {
    return { goalX: null };
  },

  addKeyboardShortcuts() {
    return {
      // Reset goalX on horizontal move; let PM handle actual navigation.
      ArrowLeft: () => {
        this.storage.goalX = null;
        return false; // pass through to PM
      },
      ArrowRight: () => {
        this.storage.goalX = null;
        return false; // pass through to PM
      },

      // Vertical: handle ourselves with goalX preservation.
      ArrowUp: () => {
        const { handled, newGoalX } = handleVerticalNav(
          this.editor.view,
          'up',
          this.storage.goalX,
          this.options.setGhostPark,
        );
        if (handled) this.storage.goalX = newGoalX;
        return handled;
      },
      ArrowDown: () => {
        const { handled, newGoalX } = handleVerticalNav(
          this.editor.view,
          'down',
          this.storage.goalX,
          this.options.setGhostPark,
        );
        if (handled) this.storage.goalX = newGoalX;
        return handled;
      },

      // Tab: jump between mathInline atoms.
      Tab: () => handleTab(this.editor.view, false),
      'Shift-Tab': () => handleTab(this.editor.view, true),
    };
  },
});
