import { describe, it, expect, afterEach } from 'vitest';
import { Editor } from '@tiptap/react';
import { NibDocument } from './extensions/NibDocument';
import { NibText } from './extensions/NibText';
import { NibBlock } from './extensions/NibBlock';

let editor: Editor | null = null;

function makeEditor() {
  editor = new Editor({
    extensions: [NibDocument, NibText, NibBlock],
    content: {
      type: 'doc',
      content: [
        {
          type: 'nibBlock',
          attrs: {
            id: 'seed',
            lineIndex: 1,
            xOffset: 40,
            blockType: 'math',
            blockState: 'editing-math',
          },
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
  it('doc is a flat list of nibBlocks (no paragraph) with placement attrs', () => {
    const e = makeEditor();
    const json = e.getJSON();
    expect(json.type).toBe('doc');
    expect(json.content).toHaveLength(1);
    const block = json.content![0];
    expect(block.type).toBe('nibBlock');
    expect(block.attrs?.lineIndex).toBe(1);
    expect(block.attrs?.xOffset).toBe(40);
    expect(block.attrs?.blockType).toBe('math');
  });

  it('insertNibBlock appends a math block with the given lineIndex/xOffset', () => {
    const e = makeEditor();
    e.commands.insertNibBlock({ lineIndex: 3, xOffset: 120 });
    const blocks = e.getJSON().content!;
    expect(blocks).toHaveLength(2);
    const added = blocks[blocks.length - 1];
    expect(added.attrs?.lineIndex).toBe(3);
    expect(added.attrs?.xOffset).toBe(120);
    expect(added.attrs?.blockType).toBe('math');
    expect(added.attrs?.blockState).toBe('editing-math');
    expect(typeof added.attrs?.id).toBe('string');
    expect(added.attrs?.id).not.toBe('');
  });

  it('insertNibBlock with blockType=ink yields ink-capture state', () => {
    const e = makeEditor();
    e.commands.insertNibBlock({ lineIndex: 5, xOffset: 10, blockType: 'ink' });
    const blocks = e.getJSON().content!;
    const added = blocks[blocks.length - 1];
    expect(added.attrs?.blockType).toBe('ink');
    expect(added.attrs?.blockState).toBe('ink-capture');
  });

  it('a newly inserted block is empty (textContent "") → eligible for blur-delete', () => {
    const e = makeEditor();
    e.commands.insertNibBlock({ lineIndex: 2, xOffset: 60 });
    // Last node in the doc is the freshly inserted, empty block.
    const doc = e.state.doc;
    const last = doc.child(doc.childCount - 1);
    expect(last.type.name).toBe('nibBlock');
    expect(last.textContent).toBe('');
  });

  it('convertNibBlock math→text turns LaTeX into plain text', () => {
    editor = new Editor({
      extensions: [NibDocument, NibText, NibBlock],
      content: {
        type: 'doc',
        content: [
          {
            type: 'nibBlock',
            attrs: {
              id: 'm1',
              lineIndex: 0,
              xOffset: 0,
              blockType: 'math',
              blockState: 'editing-math',
              latexContent: 'x^2',
            },
          },
        ],
      },
    });
    editor.commands.convertNibBlock('m1');
    const block = editor.getJSON().content![0];
    expect(block.attrs?.blockType).toBe('text');
    expect(block.attrs?.blockState).toBe('editing-text');
    expect(block.attrs?.latexContent).toBe('');
    // The LaTeX became the text content.
    const doc = editor.state.doc;
    expect(doc.child(0).textContent).toBe('x^2');
  });

  it('convertNibBlock text→math seeds latexContent from text', () => {
    editor = new Editor({
      extensions: [NibDocument, NibText, NibBlock],
      content: {
        type: 'doc',
        content: [
          {
            type: 'nibBlock',
            attrs: {
              id: 't1',
              lineIndex: 0,
              xOffset: 0,
              blockType: 'text',
              blockState: 'editing-text',
            },
            content: [{ type: 'text', text: 'a+b' }],
          },
        ],
      },
    });
    editor.commands.convertNibBlock('t1');
    const block = editor.getJSON().content![0];
    expect(block.attrs?.blockType).toBe('math');
    expect(block.attrs?.blockState).toBe('editing-math');
    expect(block.attrs?.latexContent).toBe('a+b');
  });
});
