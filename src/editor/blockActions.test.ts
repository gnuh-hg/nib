import { describe, it, expect, afterEach } from 'vitest';
import { Editor } from '@tiptap/react';
import { NibDocument } from './extensions/NibDocument';
import { NibText } from './extensions/NibText';
import { NibBlock } from './extensions/NibBlock';
import { evalBlock, deleteBlock, patchBlock, findBlock } from './blockActions';

let editor: Editor | null = null;

function mathEditor(latex: string) {
  editor = new Editor({
    extensions: [NibDocument, NibText, NibBlock],
    content: {
      type: 'doc',
      content: [
        {
          type: 'nibBlock',
          attrs: {
            id: 'b1',
            lineIndex: 0,
            xOffset: 0,
            blockType: 'math',
            blockState: 'editing-math',
            latexContent: latex,
          },
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

describe('blockActions (shared eval path used by NodeView + toolbar)', () => {
  it('evalBlock runs the golden loop: editing → result-exact 2x', async () => {
    const e = mathEditor('\\frac{d}{dx}x^2');
    await evalBlock(e, 'b1');
    const attrs = findBlock(e, 'b1')!.node.attrs;
    expect(attrs.blockState).toBe('result-exact');
    expect(attrs.exactLatex).toBe('2x');
    expect(attrs.isApprox).toBe(false);
  });

  it('evalBlock maps approx-only fixture to result-approx', async () => {
    const e = mathEditor('\\int_0^1 e^{x^2}\\,dx');
    await evalBlock(e, 'b1');
    const attrs = findBlock(e, 'b1')!.node.attrs;
    expect(attrs.blockState).toBe('result-approx');
    expect(attrs.isApprox).toBe(true);
    expect(attrs.approxLatex).toBe('1.4627');
  });

  it('evalBlock maps a bad input to the error state', async () => {
    const e = mathEditor('\\badinput');
    await evalBlock(e, 'b1');
    const attrs = findBlock(e, 'b1')!.node.attrs;
    expect(attrs.blockState).toBe('error');
    expect(attrs.errorKind).toBe('parse');
  });

  it('patchBlock merges attrs; deleteBlock removes the node', () => {
    const e = mathEditor('x');
    patchBlock(e, 'b1', { color: 'teal', mathSize: 'display' });
    expect(findBlock(e, 'b1')!.node.attrs.color).toBe('teal');
    expect(findBlock(e, 'b1')!.node.attrs.mathSize).toBe('display');
    deleteBlock(e, 'b1');
    expect(findBlock(e, 'b1')).toBeNull();
  });
});
