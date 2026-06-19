import { Node } from '@tiptap/core';

/**
 * Custom top-level doc node. The document is a flat sequence of nibBlock nodes
 * (free-placement model) — NO paragraph wrapper (design/feature.md §2).
 */
export const NibDocument = Node.create({
  name: 'doc',
  topNode: true,
  // Zero-or-more so the canvas can be truly empty (ghost-text onboarding state).
  content: 'nibBlock*',
});
