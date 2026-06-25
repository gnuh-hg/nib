import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';
import { Schema } from '@tiptap/pm/model';
import { EditorState } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import {
  materialize,
  materializeGap,
  isPrintableKey,
} from './materializeInput';
import {
  createVirtualCaretPlugin,
  getVirtualCaret,
  virtualCaretKey,
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
