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

/**
 * The free-placement block node. draggable:false (architect), selectable:false
 * (active state is React-driven, not PM selection). Content is inline text;
 * math content lives in MathLive.
 *
 * Since Phase B (CC-1) the node carries ONLY structural attrs ({id, blockType,
 * starter}). Layout/CAS fields (xOffset, lineIndex, blockState, latexContent,
 * results, …) live in the Yjs `blockMeta` side-channel keyed by id — see
 * `yBlockMeta.ts` — because y-prosemirror does not sync node attrs reliably.
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
      blockType: { default: 'math' },
      starter: { default: false },
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
          // Structural node only; layout (opts.lineIndex/xOffset) + initial state
          // go to blockMeta via initBlockMeta in the caller (Workspace, B.5).
          const node = this.type.createAndFill({ id: genId(), blockType });
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
            // Structural toggle only (blockType). blockState + latexContent↔text
            // bridging lives in blockMeta and is handled by the meta-aware path
            // once Workspace wires ydoc (B.5); math content is in MathLive, so a
            // math node has no PM text to carry over.
            const newNode = toText
              ? this.type.create(
                  { ...node.attrs, blockType: 'text' },
                  node.textContent ? state.schema.text(node.textContent) : null,
                )
              : this.type.create({ ...node.attrs, blockType: 'math' });
            dispatch(state.tr.replaceWith(pos, pos + node.nodeSize, newNode));
          }
          return true;
        },
    };
  },
});
