// appendTransaction plugin for auto-init of rowMeta + blockMeta side-channels.
//
// ARCHITECTURE.md §2 (Phase B.2):
//   Every PM transaction that creates a new `row` or `mathInline` node must
//   initialise the corresponding rowMeta / blockMeta Yjs entry so downstream
//   observers receive DEFAULT values instead of null/undefined.
//
// LAZY GC approach (chosen for Phase B):
//   When a row or mathInline is DELETED from the PM doc, we do NOT immediately
//   delete the meta entry. Reason: yUndoPlugin restores the node with its
//   original `id` — if blockMeta was already deleted, the result is lost.
//   Strategy: orphan entries (meta with no corresponding PM node) are GC'd
//   lazily on doc-load or on an explicit sweep, never inline in appendTransaction.
//   This is safe because IDs are generated once (crypto.randomUUID) and never
//   reused across documents.
//   Decision recorded here per PLAN B.2 CHECKPOINT requirement.

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type * as Y from 'yjs';
import type { Node as PMNode } from '@tiptap/pm/model';
import { initBlockMeta } from '@/editor/yBlockMeta';
import { initRowMeta } from '@/lib/yRowMeta';

// ---- ID collection helpers ----

interface DocIds {
  rowIds: Set<string>;
  atomIds: Set<string>;
}

function collectIds(doc: PMNode): DocIds {
  const rowIds = new Set<string>();
  const atomIds = new Set<string>();
  doc.descendants((node) => {
    const id = node.attrs.id as string | null | undefined;
    if (id) {
      if (node.type.name === 'row') rowIds.add(id);
      if (node.type.name === 'mathInline') atomIds.add(id);
    }
    return true; // descend into children
  });
  return { rowIds, atomIds };
}

// ---- TipTap Extension ----

interface MetaSyncOptions {
  ydoc: Y.Doc | null;
}

/**
 * MetaSyncPlugin — configurable TipTap Extension.
 * Must be added to the editor with `.configure({ ydoc })`.
 *
 * Diffs each PM transaction for created row / mathInline ids and auto-inits
 * the corresponding rowMeta / blockMeta entries with DEFAULT values.
 * Deletions are handled by lazy GC (see module comment above).
 */
export const MetaSyncPlugin = Extension.create<MetaSyncOptions>({
  name: 'metaSync',

  addOptions(): MetaSyncOptions {
    return { ydoc: null };
  },

  addProseMirrorPlugins() {
    const ydoc = this.options.ydoc;

    return [
      new Plugin({
        key: new PluginKey('metaSync'),

        appendTransaction(transactions, oldState, newState) {
          // Skip if nothing changed in the document structure.
          if (!transactions.some((tr) => tr.docChanged)) return null;

          const prev = collectIds(oldState.doc);
          const next = collectIds(newState.doc);

          // Init newly created row ids.
          for (const id of next.rowIds) {
            if (!prev.rowIds.has(id)) {
              initRowMeta(ydoc, id); // idempotent — creates entry with DEFAULT_ROW_META
            }
          }

          // Init newly created mathInline atom ids.
          for (const id of next.atomIds) {
            if (!prev.atomIds.has(id)) {
              initBlockMeta(ydoc, id); // idempotent — creates entry with DEFAULT_META
            }
          }

          // LAZY GC: do NOT delete entries for removed ids here.
          // See module comment for rationale (undo safety).

          return null; // no additional PM transaction needed
        },
      }),
    ];
  },
});
