import { Extension } from '@tiptap/core';
import * as Y from 'yjs';
import { ySyncPlugin, yUndoPlugin } from 'y-prosemirror';
import { AllSelection, Plugin } from '@tiptap/pm/state';

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

    // Ensure AllSelection when the doc is empty so y-prosemirror stores
    // { type: 'all' } as the "before-transaction" selection instead of
    // TextSelection at pos 0 (doc-root).
    //
    // y-prosemirror sync-plugin restores the selection after applying Yjs
    // updates (restoreRelativeSelection).  If the stored type is 'text' with
    // anchor mapped to pos 0 in the new doc, it calls TextSelection.between(
    //   doc.resolve(0), ...
    // ) which throws "TextSelection endpoint not pointing into a node with
    // inline content" because pos 0 in doc(row*) is the doc node, not a row.
    //
    // AllSelection.jsonID = 'all'; restoreRelativeSelection('all') → always
    // uses new AllSelection(tr.doc) which is valid for any doc content.
    const safeEmptyDocPlugin = new Plugin({
      appendTransaction(_trs, _oldState, newState) {
        if (
          newState.doc.content.size === 0 &&
          !(newState.selection instanceof AllSelection)
        ) {
          try {
            return newState.tr.setSelection(new AllSelection(newState.doc));
          } catch { /* defensive: some edge-case schema may reject AllSelection */ }
        }
        return null;
      },
    });

    return [
      safeEmptyDocPlugin,
      ySyncPlugin(xmlFragment),
      yUndoPlugin({ undoManager }),
    ];
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
