import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { RowView } from '@/editor/RowView';

/**
 * Row node — the core structural unit of the free-caret document model (ARCHITECTURE.md §1).
 *
 * doc(content: row*)
 * row(content: (text | mathInline)*)
 *
 * Each row is a continuous editable line; caret moves linearly across text and
 * math atoms within the row. Layout (blankBefore / indent) lives in the Yjs
 * `rowMeta` side-channel (Phase B.2 / yRowMeta.ts) — NOT in PM attrs.
 *
 * ONLY attr: `{ id }` (static, set once at creation, never mutated).
 * This avoids the y-prosemirror attr-sync bug CC-1.
 */
export const Row = Node.create({
  name: 'row',
  group: 'block',
  content: '(text | mathInline)*',
  defining: true,
  draggable: false,
  selectable: false,

  addAttributes() {
    return {
      id: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-nib-row]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-nib-row': '' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(RowView);
  },
});
