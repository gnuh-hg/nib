import { Node } from '@tiptap/core';

/**
 * Custom top-level doc node. The document is a sequence of `row` nodes
 * (free-caret row-based model, ARCHITECTURE.md §1) — NO paragraph wrapper.
 * Zero-or-more so the canvas can be truly empty.
 *
 * Phase B switch: content changed from 'nibBlock*' → 'row*'.
 * NibBlock is kept as a legacy file for migration reference only (NOT registered).
 */
export const NibDocument = Node.create({
  name: 'doc',
  topNode: true,
  content: 'row*',
});
