import { Mark } from '@tiptap/core';

// Minimal inline marks for text blocks (B/I/U/S) — avoids pulling the full
// StarterKit. Keyboard shortcuts mirror common editors.

export const NibBold = Mark.create({
  name: 'bold',
  parseHTML() {
    return [{ tag: 'strong' }, { tag: 'b' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['strong', HTMLAttributes, 0];
  },
  addKeyboardShortcuts() {
    return { 'Mod-b': () => this.editor.commands.toggleMark(this.name) };
  },
});

export const NibItalic = Mark.create({
  name: 'italic',
  parseHTML() {
    return [{ tag: 'em' }, { tag: 'i' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['em', HTMLAttributes, 0];
  },
  addKeyboardShortcuts() {
    return { 'Mod-i': () => this.editor.commands.toggleMark(this.name) };
  },
});

export const NibUnderline = Mark.create({
  name: 'underline',
  parseHTML() {
    return [{ tag: 'u' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['u', HTMLAttributes, 0];
  },
  addKeyboardShortcuts() {
    return { 'Mod-u': () => this.editor.commands.toggleMark(this.name) };
  },
});

export const NibStrike = Mark.create({
  name: 'strike',
  parseHTML() {
    return [{ tag: 's' }, { tag: 'del' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['s', HTMLAttributes, 0];
  },
  addKeyboardShortcuts() {
    return { 'Mod-Shift-s': () => this.editor.commands.toggleMark(this.name) };
  },
});
