import { Extension } from '@tiptap/core';
import * as Y from 'yjs';
import { ySyncPlugin, yUndoPlugin } from 'y-prosemirror';

/**
 * Binds the TipTap document to the Yjs XmlFragment (collaborative sync) and
 * provides CRDT-aware undo/redo, replacing the old ProseMirror-history extension
 * (deleted in B.4) so undo/redo respect remote changes (ARCHITECTURE §A, §E R2).
 *
 * The `xmlFragment` is supplied by Workspace via `YjsSync.configure({ xmlFragment })`
 * once <YjsProvider> is wired (Session B.5). Until then the fragment is null and
 * the extension adds no plugins (undo is a safe no-op).
 */
export interface YjsSyncOptions {
  /** Shared Y.XmlFragment for the active doc; null until B.5 wires the provider. */
  xmlFragment: Y.XmlFragment | null;
}

export interface YjsSyncStorage {
  /** The Yjs undo manager driving TopStrip / palette / keyboard undo+redo. */
  undoManager: Y.UndoManager | null;
}

export const YjsSync = Extension.create<YjsSyncOptions, YjsSyncStorage>({
  name: 'YjsSync',

  addOptions() {
    return { xmlFragment: null };
  },

  addStorage() {
    return { undoManager: null };
  },

  addProseMirrorPlugins() {
    const { xmlFragment } = this.options;
    if (!xmlFragment) return []; // not wired yet (B.4→B.5 intermediate)
    const undoManager = new Y.UndoManager(xmlFragment);
    this.storage.undoManager = undoManager;
    return [ySyncPlugin(xmlFragment), yUndoPlugin({ undoManager })];
  },

  addKeyboardShortcuts() {
    return {
      'Mod-z': () => {
        this.storage.undoManager?.undo();
        return true;
      },
      'Mod-y': () => {
        this.storage.undoManager?.redo();
        return true;
      },
      'Mod-Shift-z': () => {
        this.storage.undoManager?.redo();
        return true;
      },
    };
  },
});
