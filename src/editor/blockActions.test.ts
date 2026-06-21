import { describe, it, expect, afterEach } from 'vitest';
import { Editor } from '@tiptap/react';
import * as Y from 'yjs';
import { NibDocument } from './extensions/NibDocument';
import { NibText } from './extensions/NibText';
import { NibBlock } from './extensions/NibBlock';
import { evalBlock, deleteBlock, patchBlock, findBlock } from './blockActions';
import { getBlockMeta } from './yBlockMeta';

// Phase B: layout/CAS results live in the Yjs blockMeta side-channel, so the
// shared eval path reads latex from + writes results to blockMeta (CC-1).

let editor: Editor | null = null;

function mathEditor(latex: string, ydoc: Y.Doc) {
  editor = new Editor({
    extensions: [NibDocument, NibText, NibBlock],
    content: {
      type: 'doc',
      content: [{ type: 'nibBlock', attrs: { id: 'b1', blockType: 'math' } }],
    },
  });
  // Seed the block's latex in blockMeta (the source evalBlock reads from).
  patchBlock(ydoc, 'b1', { latexContent: latex });
  return editor;
}

afterEach(() => {
  editor?.destroy();
  editor = null;
});

describe('blockActions (shared eval path used by NodeView + toolbar)', () => {
  it('evalBlock runs the golden loop: editing → result-exact 2x', async () => {
    const ydoc = new Y.Doc();
    const e = mathEditor('\\frac{d}{dx}x^2', ydoc);
    await evalBlock(e, ydoc, 'b1');
    const meta = getBlockMeta(ydoc, 'b1');
    expect(meta.blockState).toBe('result-exact');
    expect(meta.exactLatex).toBe('2x');
    expect(meta.isApprox).toBe(false);
  });

  it('evalBlock maps approx-only fixture to result-approx', async () => {
    const ydoc = new Y.Doc();
    const e = mathEditor('\\int_0^1 e^{x^2}\\,dx', ydoc);
    await evalBlock(e, ydoc, 'b1');
    const meta = getBlockMeta(ydoc, 'b1');
    expect(meta.blockState).toBe('result-approx');
    expect(meta.isApprox).toBe(true);
    expect(meta.approxLatex).toBe('1.4627');
  });

  it('evalBlock maps a bad input to the error state', async () => {
    const ydoc = new Y.Doc();
    const e = mathEditor('\\badinput', ydoc);
    await evalBlock(e, ydoc, 'b1');
    const meta = getBlockMeta(ydoc, 'b1');
    expect(meta.blockState).toBe('error');
    expect(meta.errorKind).toBe('parse');
  });

  it('patchBlock merges meta; deleteBlock removes node + meta', () => {
    const ydoc = new Y.Doc();
    const e = mathEditor('x', ydoc);
    patchBlock(ydoc, 'b1', { color: 'teal', mathSize: 'display' });
    expect(getBlockMeta(ydoc, 'b1').color).toBe('teal');
    expect(getBlockMeta(ydoc, 'b1').mathSize).toBe('display');
    deleteBlock(e, ydoc, 'b1');
    expect(findBlock(e, 'b1')).toBeNull();
  });
});
