import { describe, it, expect, afterEach } from 'vitest';
import { Editor } from '@tiptap/react';
import { NibDocument } from './extensions/NibDocument';
import { NibText } from './extensions/NibText';
import { NibBlock } from './extensions/NibBlock';

// Phase B (CC-1): the nibBlock node carries ONLY structural attrs
// {id, blockType, starter}. Layout/CAS (xOffset, lineIndex, blockState,
// latexContent, …) live in the Yjs blockMeta side-channel, so these document-
// model tests assert structure/content only — meta is covered by yBlockMeta.test.ts.

let editor: Editor | null = null;

function makeEditor() {
  editor = new Editor({
    extensions: [NibDocument, NibText, NibBlock],
    content: {
      type: 'doc',
      content: [
        {
          type: 'nibBlock',
          attrs: { id: 'seed', blockType: 'math' },
          content: [{ type: 'text', text: 'x^2' }],
        },
      ],
    },
  });
  return editor;
}

afterEach(() => {
  editor?.destroy();
  editor = null;
});

describe('NibBlock document model', () => {
  it('doc is a flat list of nibBlocks (no paragraph) with structural attrs', () => {
    const e = makeEditor();
    const json = e.getJSON();
    expect(json.type).toBe('doc');
    expect(json.content).toHaveLength(1);
    const block = json.content![0];
    expect(block.type).toBe('nibBlock');
    expect(block.attrs?.id).toBe('seed');
    expect(block.attrs?.blockType).toBe('math');
  });

  it('insertNibBlock appends a math block with a generated id', () => {
    const e = makeEditor();
    e.commands.insertNibBlock({ lineIndex: 3, xOffset: 120 });
    const blocks = e.getJSON().content!;
    expect(blocks).toHaveLength(2);
    const added = blocks[blocks.length - 1];
    expect(added.attrs?.blockType).toBe('math');
    expect(typeof added.attrs?.id).toBe('string');
    expect(added.attrs?.id).not.toBe('');
    // Layout (lineIndex/xOffset) is no longer a node attr — it lives in blockMeta.
    expect(added.attrs?.lineIndex).toBeUndefined();
    expect(added.attrs?.xOffset).toBeUndefined();
  });

  it('insertNibBlock with blockType=ink yields an ink block', () => {
    const e = makeEditor();
    e.commands.insertNibBlock({ lineIndex: 5, xOffset: 10, blockType: 'ink' });
    const blocks = e.getJSON().content!;
    const added = blocks[blocks.length - 1];
    expect(added.attrs?.blockType).toBe('ink');
  });

  it('a newly inserted block is empty (textContent "") → eligible for blur-delete', () => {
    const e = makeEditor();
    e.commands.insertNibBlock({ lineIndex: 2, xOffset: 60 });
    const doc = e.state.doc;
    const last = doc.child(doc.childCount - 1);
    expect(last.type.name).toBe('nibBlock');
    expect(last.textContent).toBe('');
  });

  it('convertNibBlock math→text toggles blockType and carries PM text content', () => {
    editor = new Editor({
      extensions: [NibDocument, NibText, NibBlock],
      content: {
        type: 'doc',
        content: [
          {
            type: 'nibBlock',
            attrs: { id: 'm1', blockType: 'math' },
            content: [{ type: 'text', text: 'x^2' }],
          },
        ],
      },
    });
    editor.commands.convertNibBlock('m1');
    const block = editor.getJSON().content![0];
    expect(block.attrs?.blockType).toBe('text');
    // The PM text content carries over on math→text.
    expect(editor.state.doc.child(0).textContent).toBe('x^2');
  });

  it('convertNibBlock text→math toggles blockType', () => {
    editor = new Editor({
      extensions: [NibDocument, NibText, NibBlock],
      content: {
        type: 'doc',
        content: [
          {
            type: 'nibBlock',
            attrs: { id: 't1', blockType: 'text' },
            content: [{ type: 'text', text: 'a+b' }],
          },
        ],
      },
    });
    editor.commands.convertNibBlock('t1');
    const block = editor.getJSON().content![0];
    expect(block.attrs?.blockType).toBe('math');
    // latexContent seeding from text now lives in blockMeta (wired in B.5).
  });
});
