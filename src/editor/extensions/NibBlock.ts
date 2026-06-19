import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { TextSelection } from '@tiptap/pm/state';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { NibBlockView } from '../NibBlockView';
import type { BlockType } from '@/types/block';

export interface InsertNibBlockOptions {
  lineIndex: number;
  xOffset: number;
  blockType?: BlockType;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    nibBlock: {
      /** Insert a free-placement block at (lineIndex, xOffset) and focus it. */
      insertNibBlock: (opts: InsertNibBlockOptions) => ReturnType;
      /** Toggle a block between math and text type (Convert). */
      convertNibBlock: (id: string) => ReturnType;
    };
  }
}

function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `b-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function initialState(blockType: BlockType): string {
  if (blockType === 'ink') return 'ink-capture';
  if (blockType === 'text') return 'editing-text';
  return 'editing-math';
}

/**
 * The free-placement block node. draggable:false (architect), selectable:false
 * (active state is React-driven, not PM selection). Content is inline text in
 * Phase 0; MathLive replaces math-block content in Session 1.3.
 */
export const NibBlock = Node.create({
  name: 'nibBlock',
  group: 'block',
  content: 'inline*',
  draggable: false,
  selectable: false,
  defining: true,

  addAttributes() {
    return {
      id: { default: null },
      lineIndex: { default: 0 },
      xOffset: { default: 0 },
      blockType: { default: 'math' },
      blockState: { default: 'editing-math' },
      latexContent: { default: '' },
      exactLatex: { default: '' },
      approxLatex: { default: '' },
      isApprox: { default: false },
      errorKind: { default: '' },
      textScale: { default: 'body' },
      mathSize: { default: 'normal' },
      color: { default: '' },
      starter: { default: false },
      inkStrokes: { default: [] },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-nib-block]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-nib-block': '' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(NibBlockView);
  },

  addCommands() {
    return {
      insertNibBlock:
        (opts) =>
        ({ state, dispatch }) => {
          const blockType = opts.blockType ?? 'math';
          const node = this.type.createAndFill({
            id: genId(),
            lineIndex: opts.lineIndex,
            xOffset: opts.xOffset,
            blockType,
            blockState: initialState(blockType),
          });
          if (!node) return false;

          // Free placement: visual position comes from attrs, so doc order is
          // irrelevant — append at the end of the document.
          const pos = state.doc.content.size;
          if (dispatch) {
            const tr = state.tr.insert(pos, node);
            const sel = TextSelection.create(tr.doc, pos + 1);
            tr.setSelection(sel).scrollIntoView();
            dispatch(tr);
          }
          return true;
        },

      convertNibBlock:
        (id) =>
        ({ state, dispatch }) => {
          let found: { pos: number; node: ProseMirrorNode } | null = null;
          state.doc.descendants((node, pos) => {
            if (node.type.name === this.name && node.attrs.id === id) {
              found = { pos, node };
              return false;
            }
            return true;
          });
          if (!found) return false;

          const { pos, node } = found as { pos: number; node: ProseMirrorNode };
          const toText = node.attrs.blockType === 'math';

          if (dispatch) {
            let newNode;
            if (toText) {
              // Math → text: math content (LaTeX) becomes plain text.
              const text = (node.attrs.latexContent as string) || node.textContent;
              newNode = this.type.create(
                {
                  ...node.attrs,
                  blockType: 'text',
                  blockState: 'editing-text',
                  latexContent: '',
                },
                text ? state.schema.text(text) : null,
              );
            } else {
              // Text → math: plain text becomes the LaTeX seed.
              const text = node.textContent;
              newNode = this.type.create({
                ...node.attrs,
                blockType: 'math',
                blockState: 'editing-math',
                latexContent: text,
              });
            }
            dispatch(state.tr.replaceWith(pos, pos + node.nodeSize, newNode));
          }
          return true;
        },
    };
  },
});
