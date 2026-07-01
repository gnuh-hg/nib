import { describe, it, expect, beforeEach } from 'vitest';
import { Schema, type Node as PMNode } from '@tiptap/pm/model';
import { EditorState, TextSelection } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import {
  tryMoveHorizontal,
  tryMoveVertical,
  getGoalX,
  resetGoalX,
} from './arrowNav';
import {
  createVirtualCaretPlugin,
  getVirtualCaret,
  virtualCaretKey,
  INACTIVE,
  type VirtualCaretState,
} from './virtualCaret';

// Schema mirroring the real (spacer_atom | text)* paragraph.
const schema = new Schema({
  nodes: {
    doc: { content: 'paragraph*' },
    paragraph: {
      group: 'block',
      content: '(spacer_atom | text)*',
      toDOM: () => ['p', 0],
    },
    spacer_atom: {
      group: 'inline',
      inline: true,
      atom: true,
      attrs: { id: { default: null } },
      toDOM: () => ['span', { class: 'nib-spacer' }],
    },
    text: { group: 'inline' },
  },
});

type Rect = { left: number; right: number; top: number; bottom: number };
const rect = (left: number, top = 0, bottom = 16, right = left): Rect => ({
  left,
  right,
  top,
  bottom,
});

/** doc = [text "ab"][spacer_atom id][text "cd"]; spacer at pos 3 (nodeSize 1). */
function spacerDoc(id = 'S'): PMNode {
  return schema.node('doc', null, [
    schema.node('paragraph', null, [
      schema.text('ab'),
      schema.node('spacer_atom', { id }),
      schema.text('cd'),
    ]),
  ]);
}

interface NavViewOpts {
  doc: PMNode;
  coords: (pos: number) => Rect;
  posAtCoords?: (c: { left: number; top: number }) => { pos: number; inside: number } | null;
  selectionPos?: number;
  vcState?: VirtualCaretState;
}

/**
 * Minimal EditorView stand-in for arrow-nav: a mutable state, configurable
 * coordsAtPos / posAtCoords stubs (fixed pixel bounds — no real layout), and a
 * dispatch that re-applies the tx. A real <div> backs `dom` so measureSpaceWidth
 * (canvas → null in jsdom → 7px fallback) and getBoundingClientRect both work.
 */
function makeNavView(opts: NavViewOpts) {
  let state = EditorState.create({
    schema,
    doc: opts.doc,
    plugins: [createVirtualCaretPlugin()],
    selection:
      opts.selectionPos != null
        ? TextSelection.create(opts.doc, opts.selectionPos)
        : undefined,
  });
  if (opts.vcState) {
    state = state.apply(state.tr.setMeta(virtualCaretKey, opts.vcState));
  }
  const posAtCoordsCalls: { left: number; top: number }[] = [];
  const view = {
    get state() {
      return state;
    },
    coordsAtPos: (pos: number) => opts.coords(pos),
    posAtCoords: (c: { left: number; top: number }) => {
      posAtCoordsCalls.push(c);
      return opts.posAtCoords ? opts.posAtCoords(c) : null;
    },
    dispatch: (tr: ReturnType<typeof state.tr.setMeta>) => {
      state = state.apply(tr);
    },
    dom: document.createElement('div'), // jsdom rect = all zeros → viewLeft 0
  } as unknown as EditorView;
  return {
    view,
    get posAtCoordsCalls() {
      return posAtCoordsCalls;
    },
  };
}

const SPACE_W = 7; // measureSpaceWidth fallback in jsdom (no canvas)

describe('arrowNav — horizontal (Session B.2)', () => {
  beforeEach(() => resetGoalX());

  it('(2) ArrowRight past spacer right-edge → PM selection after spacer + INACTIVE', () => {
    // spacer pos 3: left=100, right(pos4)=110. vc at 106 → +7 = 113 ≥ 110-0.5.
    const { view } = makeNavView({
      doc: spacerDoc(),
      coords: (pos) => (pos === 3 ? rect(100) : pos === 4 ? rect(110) : rect(0)),
    });
    const vc: VirtualCaretState = {
      active: true,
      lineDocPos: 3,
      virtualXClient: 106,
      virtualXEditorRelative: 106,
      textRightClient: 100,
    };
    expect(tryMoveHorizontal(view, vc, 'right')).toBe(true);
    expect(getVirtualCaret(view.state).active).toBe(false);
    expect(view.state.selection.from).toBe(4); // just after the spacer
  });

  it('(3) ArrowLeft when newVX ≤ textRightClient (free gap) → deactivate at lineDocPos', () => {
    const doc = schema.node('doc', null, [
      schema.node('paragraph', null, [schema.text('ab')]),
    ]);
    const { view } = makeNavView({ doc, coords: () => rect(0) });
    const vc: VirtualCaretState = {
      active: true,
      lineDocPos: 3,
      virtualXClient: 105,
      virtualXEditorRelative: 105,
      textRightClient: 100,
    };
    // 105 - 7 = 98 ≤ 100 → exit left, no spacer present.
    expect(tryMoveHorizontal(view, vc, 'left')).toBe(true);
    expect(getVirtualCaret(view.state).active).toBe(false);
    expect(view.state.selection.from).toBe(3);
  });

  it('(3b) ArrowLeft staying inside the gap just steps the caret left', () => {
    const { view } = makeNavView({
      doc: spacerDoc(),
      coords: (pos) => (pos === 3 ? rect(100) : pos === 4 ? rect(160) : rect(0)),
    });
    const vc: VirtualCaretState = {
      active: true,
      lineDocPos: 3,
      virtualXClient: 140,
      virtualXEditorRelative: 140,
      textRightClient: 100,
    };
    // 140 - 7 = 133; spacerLeft 100 < 133 < spacerRight 160 → stay, move.
    expect(tryMoveHorizontal(view, vc, 'left')).toBe(true);
    const after = getVirtualCaret(view.state);
    expect(after.active).toBe(true);
    expect(after.virtualXClient).toBeCloseTo(133, 5);
  });

  it('(4) ArrowLeft adjacent to a spacer (caret inactive) → enterSpacerFromRight activates caret', () => {
    const { view } = makeNavView({
      doc: spacerDoc(),
      coords: (pos) => (pos === 3 ? rect(100) : pos === 4 ? rect(110) : rect(0)),
      selectionPos: 4, // cursor sits AFTER the spacer (before "cd")
    });
    expect(tryMoveHorizontal(view, INACTIVE, 'left')).toBe(true);
    const after = getVirtualCaret(view.state);
    expect(after.active).toBe(true);
    expect(after.lineDocPos).toBe(3); // spacer left boundary
    expect(after.virtualXClient).toBeCloseTo(110 - SPACE_W, 5); // spacerRight - spaceW
    expect(after.textRightClient).toBe(100); // spacer left edge
  });

  it('returns false (PM default) for ArrowRight inside plain text, no spacer', () => {
    const doc = schema.node('doc', null, [
      schema.node('paragraph', null, [schema.text('abcd')]),
    ]);
    const { view } = makeNavView({ doc, coords: () => rect(0), selectionPos: 2 });
    expect(tryMoveHorizontal(view, INACTIVE, 'right')).toBe(false);
  });
});

describe('arrowNav — vertical goalX preservation (Session B.2)', () => {
  beforeEach(() => resetGoalX());

  it('(1) goalX is preserved across two ArrowDowns, even through a gap line', () => {
    // line1 "aaaaaaaa" pos1..9 | line2 "x" pos10..11 (short) | line3 "bbbbbbbb" pos12..20
    const doc = schema.node('doc', null, [
      schema.node('paragraph', null, [schema.text('aaaaaaaa')]),
      schema.node('paragraph', null, [schema.text('x')]),
      schema.node('paragraph', null, [schema.text('bbbbbbbb')]),
    ]);
    const coords = (pos: number): Rect => {
      if (pos <= 9) return rect(150, 0, 16, 300); // line1: wide
      if (pos <= 11) return rect(118, 20, 38, 120); // line2: short (right=120)
      return rect(150, 40, 56, 300); // line3: wide
    };
    const posAtCoords = (c: { left: number; top: number }) => {
      if (c.top < 18) return { pos: 5, inside: 5 };
      if (c.top < 40) return { pos: 11, inside: 11 }; // line2
      return { pos: 16, inside: 16 }; // line3
    };
    const { view, posAtCoordsCalls } = makeNavView({
      doc,
      coords,
      posAtCoords,
      selectionPos: 5, // line1, column x=150
    });

    // First ArrowDown (caret inactive): goalX := 150, land on short line2 → gap.
    let vc = getVirtualCaret(view.state);
    expect(tryMoveVertical(view, vc, 'down')).toBe(true);
    expect(getGoalX()).toBe(150);
    const onLine2 = getVirtualCaret(view.state);
    expect(onLine2.active).toBe(true); // gX 150 > line2.right 120 + threshold → gap
    expect(onLine2.lineDocPos).toBe(11);

    // Second ArrowDown (caret active now): goalX MUST still be 150, land in line3 text.
    vc = getVirtualCaret(view.state);
    expect(tryMoveVertical(view, vc, 'down')).toBe(true);
    expect(getGoalX()).toBe(150); // preserved across the deactivation
    expect(getVirtualCaret(view.state).active).toBe(false); // landed in text

    // Both descents aimed at the SAME goal column.
    expect(posAtCoordsCalls.map((c) => c.left)).toEqual([150, 150]);
  });

  it('returns false when there is no line below (posAtCoords null) but keeps goalX', () => {
    const doc = schema.node('doc', null, [
      schema.node('paragraph', null, [schema.text('only')]),
    ]);
    const { view } = makeNavView({
      doc,
      coords: () => rect(80, 0, 16, 200),
      posAtCoords: () => null,
      selectionPos: 3,
    });
    const vc = getVirtualCaret(view.state);
    expect(tryMoveVertical(view, vc, 'down')).toBe(false);
    expect(getGoalX()).toBe(80); // goalX set even though motion failed → preserved
  });
});
