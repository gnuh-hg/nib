import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';
import { Schema } from '@tiptap/pm/model';
import { EditorState } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import {
  materialize,
  materializeGap,
  isPrintableKey,
  findNextSpacer,
  shrinkOrDeleteSpacer,
  measureCharWidth,
  insertSpacer,
} from './materializeInput';
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

/**
 * Minimal EditorView stand-in: a mutable state, a stubbed coordsAtPos (content
 * right-edge = 100px), and a dispatch that applies the tx back into state.
 */
function makeView() {
  const doc = schema.node('doc', null, [
    schema.node('paragraph', null, [schema.text('ab')]),
  ]);
  let state = EditorState.create({
    schema,
    doc,
    plugins: [createVirtualCaretPlugin()],
  });
  const view = {
    get state() {
      return state;
    },
    // Regression guard (Task #10): materialize() must derive the gap from the
    // stored textRightClient, never from a live coordsAtPos() — which after the
    // caret widget renders would return the widget's x, not the text-right.
    coordsAtPos: () => {
      throw new Error('materialize must not call coordsAtPos for the gap');
    },
    dispatch: (tr: ReturnType<typeof state.tr.insertText>) => {
      state = state.apply(tr);
    },
    dom: document.createElement('div'),
  } as unknown as EditorView;
  return view;
}

// lineDocPos = end of "ab" inline content (after 'b'): doc(0) p(1) a(1) b(2) → 3.
const LINE_POS = 3;
// Text right-edge captured at click time (Task #10). materialize() now derives
// the gap from this stored value, NOT from a live coordsAtPos() call.
const TEXT_RIGHT = 100;

function vc(virtualXClient: number): VirtualCaretState {
  return {
    active: true,
    lineDocPos: LINE_POS,
    virtualXEditorRelative: virtualXClient,
    virtualXClient,
    textRightClient: TEXT_RIGHT,
  };
}

function spacerCount(view: EditorView): number {
  let n = 0;
  view.state.doc.descendants((node) => {
    if (node.type.name === 'spacer_atom') n += 1;
  });
  return n;
}

describe('materializeInput (Phase A — type → materialize, gate vàng)', () => {
  it('gap ≥ threshold + char: sets width, inserts spacer + char', () => {
    const view = makeView();
    const widthMap = new Y.Doc().getMap<number>('w');
    materialize(view, widthMap, vc(150), 'h'); // gap = 150 - 100 = 50

    expect([...widthMap.values()]).toEqual([50]);
    expect(spacerCount(view)).toBe(1);
    expect(view.state.doc.textContent).toBe('abh');
  });

  it('gap < threshold: no spacer, just inserts the char', () => {
    const view = makeView();
    const widthMap = new Y.Doc().getMap<number>('w');
    materialize(view, widthMap, vc(102), 'h'); // gap = 2 < 4

    expect(widthMap.size).toBe(0);
    expect(spacerCount(view)).toBe(0);
    expect(view.state.doc.textContent).toBe('abh');
  });

  it('IME (char=""): inserts spacer only, no text, selection after spacer', () => {
    const view = makeView();
    const widthMap = new Y.Doc().getMap<number>('w');
    materializeGap(view, widthMap, vc(200)); // gap = 100

    expect([...widthMap.values()]).toEqual([100]);
    expect(spacerCount(view)).toBe(1);
    expect(view.state.doc.textContent).toBe('ab'); // no char inserted
    // selection sits right after the spacer (lineDocPos + 1).
    expect(view.state.selection.from).toBe(LINE_POS + 1);
  });

  it('clears the virtual caret state after materialize', () => {
    const view = makeView();
    const widthMap = new Y.Doc().getMap<number>('w');
    // First activate the caret so we can observe it being cleared.
    view.dispatch(view.state.tr.setMeta(virtualCaretKey, vc(150)));
    expect(getVirtualCaret(view.state).active).toBe(true);
    materialize(view, widthMap, vc(150), 'h');
    expect(getVirtualCaret(view.state).active).toBe(false);
  });

  it('isPrintableKey: single char yes; Enter/F1/modifier chords no', () => {
    const k = (init: Partial<KeyboardEvent>) => init as KeyboardEvent;
    expect(isPrintableKey(k({ key: 'a' }))).toBe(true);
    expect(isPrintableKey(k({ key: ' ' }))).toBe(true);
    expect(isPrintableKey(k({ key: 'Enter' }))).toBe(false);
    expect(isPrintableKey(k({ key: 'F1' }))).toBe(false);
    expect(isPrintableKey(k({ key: 'c', ctrlKey: true }))).toBe(false);
    expect(isPrintableKey(k({ key: 'v', metaKey: true }))).toBe(false);
    expect(isPrintableKey(k({ key: 'a', altKey: true }))).toBe(false);
  });
});

// ── Session B.1 — unified add-char/merge law ────────────────────────────────

/** doc = [text "ab"][spacer_atom id=spacerId][text "cd"]. spacer at pos 3. */
function spacerDoc(spacerId: string) {
  return schema.node('doc', null, [
    schema.node('paragraph', null, [
      schema.text('ab'),
      schema.node('spacer_atom', { id: spacerId }),
      schema.text('cd'),
    ]),
  ]);
}

/** EditorState over spacerDoc, with the virtual-caret plugin installed. */
function spacerState(spacerId: string) {
  return EditorState.create({
    schema,
    doc: spacerDoc(spacerId),
    plugins: [createVirtualCaretPlugin()],
  });
}

/**
 * View stand-in over spacerDoc whose caret sits AFTER "ab" (pos 3), i.e. in the
 * left edge of the gap, just like a click in the left portion of a spacer.
 * coordsAtPos throws (Task #10 regression guard).
 */
function makeSpacerView(spacerId: string) {
  let state = spacerState(spacerId);
  const view = {
    get state() {
      return state;
    },
    coordsAtPos: () => {
      throw new Error('materialize must not call coordsAtPos for the gap');
    },
    dispatch: (tr: ReturnType<typeof state.tr.insertText>) => {
      state = state.apply(tr);
    },
    dom: document.createElement('div'),
  } as unknown as EditorView;
  return view;
}

// vcState for makeSpacerView: caret at pos 3 (after "ab"), text-right = 100.
function vcSpacer(virtualXClient: number): VirtualCaretState {
  return {
    active: true,
    lineDocPos: 3,
    virtualXEditorRelative: virtualXClient,
    virtualXClient,
    textRightClient: 100,
  };
}

function spacerCountIn(doc: ReturnType<typeof spacerDoc>): number {
  let n = 0;
  doc.descendants((node) => {
    if (node.type.name === 'spacer_atom') n += 1;
  });
  return n;
}

describe('findNextSpacer (E4 guard)', () => {
  it('finds the first spacer_atom at/after fromPos in the same paragraph', () => {
    const doc = spacerDoc('A');
    const hit = findNextSpacer(doc, 3); // pos 3 = boundary right before spacer
    expect(hit).not.toBeNull();
    expect(hit!.pos).toBe(3);
    expect(hit!.id).toBe('A');
    expect(hit!.nodeSize).toBe(1);
  });

  it('returns null for a paragraph with no spacer', () => {
    const doc = schema.node('doc', null, [
      schema.node('paragraph', null, [schema.text('plain')]),
    ]);
    expect(findNextSpacer(doc, 1)).toBeNull();
  });
});

describe('shrinkOrDeleteSpacer (E2 — delete-path never writes width)', () => {
  it('(a) shrink: newWidth > 0 → widthMap.set(id, newWidth), tr untouched', () => {
    const state = spacerState('A');
    const widthMap = new Y.Doc().getMap<number>('w');
    widthMap.set('A', 100);
    const tr = shrinkOrDeleteSpacer(state.tr, widthMap, 3, 1, 'A', 30);
    expect(widthMap.get('A')).toBe(70);
    // tr unchanged → spacer still present after apply.
    expect(spacerCountIn(state.apply(tr).doc)).toBe(1);
  });

  it('(b) merge: newWidth ≤ 0 → tr.delete + widthMap NOT written (has===false)', () => {
    const state = spacerState('A');
    const widthMap = new Y.Doc().getMap<number>('w');
    // 'A' deliberately absent: get('A') ?? 0 = 0 → newWidth = -50 ≤ 0 → merge.
    const tr = shrinkOrDeleteSpacer(state.tr, widthMap, 3, 1, 'A', 50);
    const after = state.apply(tr);
    expect(spacerCountIn(after.doc)).toBe(0); // spacer deleted → segments merge
    // E2: the delete-path must NEVER call widthMap.set — so no entry is created
    // for the about-to-be-destroyed node (avoids the NodeView rAF write race).
    expect(widthMap.has('A')).toBe(false);
  });
});

describe('materialize() — neighbour shrink (Case 14/15 root fix)', () => {
  it('(c) typing into a gap shrinks the next spacer by gap+charWidth', () => {
    const view = makeSpacerView('OLD');
    const widthMap = new Y.Doc().getMap<number>('w');
    widthMap.set('OLD', 200);
    const charW = measureCharWidth(view, 'x');

    materialize(view, widthMap, vcSpacer(150), 'x'); // gap = 150 - 100 = 50

    // Old neighbour shrunk by displacement = gap(50) + charWidth → segment after
    // it (here "cd") nets ZERO displacement.
    expect(widthMap.get('OLD')).toBeCloseTo(200 - (50 + charW), 5);
    // A new spacer was also created for the typed gap → 2 spacers total.
    expect(spacerCountIn(view.state.doc)).toBe(2);
    expect(view.state.doc.textContent).toBe('abxcd');
  });
});

describe('insertSpacer / Tab (Session B.3)', () => {
  it('inserts a spacer_atom at pos and registers its width on the Yjs map', () => {
    const state = EditorState.create({ schema, doc: spacerDoc('A') });
    const widthMap = new Y.Doc().getMap<number>('w');
    // Insert a fresh spacer between "ab" and the existing spacer (pos 3).
    const { tr, id } = insertSpacer(state.tr, schema, widthMap, 3, 56);
    expect(widthMap.get(id)).toBe(56);
    const after = state.apply(tr);
    expect(spacerCountIn(after.doc)).toBe(2); // original + new
    expect(after.doc.textContent).toBe('abcd'); // text unchanged
  });

  it('Tab law: spacer width = 4 × space-width inserted at the cursor pos', () => {
    // doc = [text "ab"]; Tab at end (pos 3) → spacer of 4×spaceW, no char.
    const doc = schema.node('doc', null, [
      schema.node('paragraph', null, [schema.text('ab')]),
    ]);
    const state = EditorState.create({ schema, doc });
    const widthMap = new Y.Doc().getMap<number>('w');
    const SPACE_W = 7; // jsdom measureSpaceWidth fallback — Workspace uses the same
    const { tr, id } = insertSpacer(state.tr, schema, widthMap, 3, 4 * SPACE_W);
    expect(widthMap.get(id)).toBe(28); // 4 × 7
    const after = state.apply(tr);
    expect(spacerCountIn(after.doc)).toBe(1);
    expect(after.doc.textContent).toBe('ab'); // Tab adds NO character
    // The spacer sits right after "ab" (pos 3) → nodeBefore of pos 4 is the spacer.
    expect(after.doc.resolve(4).nodeBefore?.type.name).toBe('spacer_atom');
  });
});

describe('backspace-in-gap composite (primitives, no Workspace mount)', () => {
  it('(d) shrink→0 → PM deletes spacer + caret goes INACTIVE, width not written', () => {
    let state = spacerState('A');
    const widthMap = new Y.Doc().getMap<number>('w');
    widthMap.set('A', 10); // tiny gap

    // Activate the caret so we can observe it being cleared.
    state = state.apply(state.tr.setMeta(virtualCaretKey, vcSpacer(105)));
    expect(getVirtualCaret(state).active).toBe(true);

    const spacer = findNextSpacer(state.doc, 3);
    expect(spacer).not.toBeNull();

    // displacement (space-width) ≫ stored width → merge path.
    let tr = state.tr;
    tr = shrinkOrDeleteSpacer(tr, widthMap, spacer!.pos, spacer!.nodeSize, spacer!.id, 50);
    tr = tr.setMeta(virtualCaretKey, INACTIVE);
    state = state.apply(tr);

    expect(spacerCountIn(state.doc)).toBe(0); // PM deleted the spacer
    expect(getVirtualCaret(state).active).toBe(false); // caret cleared
    expect(widthMap.has('A')).toBe(true); // E2: delete-path did NOT touch the map
    expect(widthMap.get('A')).toBe(10); // value untouched (no set to newWidth)
  });
});
