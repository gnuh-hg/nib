import { describe, it, expect } from 'vitest';
import { Schema } from '@tiptap/pm/model';
import { EditorState } from '@tiptap/pm/state';
import { DecorationSet } from '@tiptap/pm/view';
import {
  createVirtualCaretPlugin,
  virtualCaretKey,
  getVirtualCaret,
  type VirtualCaretState,
} from './virtualCaret';

// Minimal schema mirroring the real one enough to exercise the plugin without a
// full TipTap/Yjs editor mount.
const schema = new Schema({
  nodes: {
    doc: { content: 'paragraph*' },
    paragraph: { group: 'block', content: 'text*', toDOM: () => ['p', 0] },
    text: { group: 'inline' },
  },
});

function makeState() {
  const doc = schema.node('doc', null, [
    schema.node('paragraph', null, [schema.text('ab')]),
  ]);
  return EditorState.create({
    schema,
    doc,
    plugins: [createVirtualCaretPlugin()],
  });
}

const ACTIVE: VirtualCaretState = {
  active: true,
  lineDocPos: 1,
  virtualXEditorRelative: 200,
  virtualXClient: 256,
  textRightClient: 100,
};

describe('virtualCaret plugin (Phase A — click → virtual caret)', () => {
  it('initial state is inactive', () => {
    const state = makeState();
    expect(getVirtualCaret(state).active).toBe(false);
  });

  it('a transaction carrying our meta activates the caret', () => {
    const state = makeState();
    const next = state.apply(state.tr.setMeta(virtualCaretKey, ACTIVE));
    const vc = getVirtualCaret(next);
    expect(vc.active).toBe(true);
    expect(vc.lineDocPos).toBe(1);
    expect(vc.virtualXEditorRelative).toBe(200);
    expect(vc.virtualXClient).toBe(256);
  });

  it('E1: a transaction WITHOUT our meta preserves the state (no clobber)', () => {
    const state = makeState();
    const active = state.apply(state.tr.setMeta(virtualCaretKey, ACTIVE));
    expect(getVirtualCaret(active).active).toBe(true);

    // Simulate an unrelated transaction (e.g. a remote Yjs sync edit) — it
    // carries no virtualCaretKey meta, so the caret must stay exactly as is.
    const afterEdit = active.apply(active.tr.insertText('x', 1));
    const vc = getVirtualCaret(afterEdit);
    expect(vc.active).toBe(true);
    expect(vc.virtualXEditorRelative).toBe(200);
    expect(vc.virtualXClient).toBe(256);
  });

  it('an explicit inactive meta clears the caret', () => {
    const state = makeState();
    const active = state.apply(state.tr.setMeta(virtualCaretKey, ACTIVE));
    const cleared = active.apply(
      active.tr.setMeta(virtualCaretKey, {
        active: false,
        lineDocPos: 0,
        virtualXEditorRelative: 0,
        virtualXClient: 0,
        textRightClient: 0,
      }),
    );
    expect(getVirtualCaret(cleared).active).toBe(false);
  });

  it('decorations: 1 widget when active, empty set when inactive', () => {
    const plugin = createVirtualCaretPlugin();
    const decorate = plugin.props.decorations!;

    const inactiveState = EditorState.create({
      schema,
      doc: schema.node('doc', null, [
        schema.node('paragraph', null, [schema.text('ab')]),
      ]),
      plugins: [plugin],
    });
    const emptyDeco = decorate.call(plugin, inactiveState) as DecorationSet;
    expect(emptyDeco.find().length).toBe(0);

    const activeState = inactiveState.apply(
      inactiveState.tr.setMeta(virtualCaretKey, ACTIVE),
    );
    const deco = decorate.call(plugin, activeState) as DecorationSet;
    expect(deco.find().length).toBe(1);
  });
});
