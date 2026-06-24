import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';

/**
 * Phase-B placeholder MathInlineView.
 * Renders a simple "[Math]" token until Phase D wires MathLive inline.
 * `atom: true` means PM treats this as an opaque unit — no editable children.
 */
function MathInlineView() {
  return (
    <NodeViewWrapper as="span" className="nib-math-inline">
      <span className="nib-math-placeholder">[Math]</span>
    </NodeViewWrapper>
  );
}

/**
 * MathInline node — inline math atom in the free-caret document model (ARCHITECTURE.md §1).
 *
 * row(content: (text | mathInline)*)
 * mathInline — atom, selectable, no editable children in Phase B.
 *
 * The atom carries ONE static attr `{ id }`. ALL math content (latexContent,
 * blockState, exactLatex, approxLatex, …) lives in the Yjs `blockMeta`
 * side-channel (yBlockMeta.ts), keyed by this id — NOT in PM attrs (CC-1).
 *
 * Phase D will replace the placeholder NodeView with a live MathLive <math-field>
 * supporting dual-caret handoff (ARCHITECTURE.md §4).
 */
export const MathInline = Node.create({
  name: 'mathInline',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      id: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-nib-math]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-nib-math': '' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathInlineView);
  },
});
