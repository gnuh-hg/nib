import { Node } from '@tiptap/core';

/**
 * Minimal editor schema (typing/document layer wiped 2026-06-25 — free-caret
 * row/nibBlock model removed; a fresh typing schema will be built from zero).
 *
 * Document → block+ where the only block is a plain paragraph holding inline
 * text. This is the smallest schema that still lets TipTap + y-prosemirror bind
 * and render one empty editable area in <Workspace>. Marks (B/I/U/S, marks.ts)
 * still apply to the text inside a paragraph.
 *
 * `content: 'block*'` (zero-or-more) keeps a truly empty canvas legal; the
 * YjsSync safeEmptyDocPlugin guards the empty-doc selection edge case.
 */
export const NibDocument = Node.create({
  name: 'doc',
  topNode: true,
  content: 'block*',
});

/**
 * Plain paragraph — the sole block node in the minimal schema.
 *
 * Content is `(spacer_atom | text)*` (Phase A free-caret-v2, Path B): a paragraph
 * holds a free interleaving of plain text and `spacer_atom` inline leaves. The
 * spacer atoms are the virtual-whitespace mechanism — they materialize on input
 * to push subsequent text to an arbitrary x without literal space litter, and
 * merge away naturally when their width reaches 0 (PM drops the atom). Both
 * `spacer_atom` and `text` are in group `inline`, so `(spacer_atom | text)*` is
 * the explicit form of the prior `inline*` plus the new leaf.
 */
export const NibParagraph = Node.create({
  name: 'paragraph',
  group: 'block',
  content: '(spacer_atom | text)*',
  parseHTML() {
    return [{ tag: 'p' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['p', HTMLAttributes, 0];
  },
});

/** Inline text node so paragraphs have something to hold. */
export const NibTextNode = Node.create({
  name: 'text',
  group: 'inline',
});
