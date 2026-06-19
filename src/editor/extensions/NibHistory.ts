import { Extension } from '@tiptap/core';
import { history, undo, redo } from '@tiptap/pm/history';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    nibHistory: {
      undo: () => ReturnType;
      redo: () => ReturnType;
    };
  }
}

/** Undo/redo via ProseMirror history (used by Ctrl+Z/Y and the palette). */
export const NibHistory = Extension.create({
  name: 'nibHistory',
  addProseMirrorPlugins() {
    return [history()];
  },
  addCommands() {
    return {
      undo:
        () =>
        ({ state, dispatch }) =>
          undo(state, dispatch),
      redo:
        () =>
        ({ state, dispatch }) =>
          redo(state, dispatch),
    };
  },
  addKeyboardShortcuts() {
    return {
      'Mod-z': () => this.editor.commands.undo(),
      'Mod-y': () => this.editor.commands.redo(),
      'Mod-Shift-z': () => this.editor.commands.redo(),
    };
  },
});
