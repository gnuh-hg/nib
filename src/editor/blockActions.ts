import type { Editor } from '@tiptap/react';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import type * as Y from 'yjs';
import { mockEval } from '@/services/mockCAS';
import { resultToAttrs } from './evalResult';
import { getBlockMeta, patchBlockMeta, deleteBlockMeta } from './yBlockMeta';
import type { BlockState, BlockMetaRecord } from '@/types/block';

export interface FoundBlock {
  node: ProseMirrorNode;
  pos: number;
}

/**
 * Locate a mathInline atom by its id attr (Phase B+ — row-based schema).
 * Previously searched for 'nibBlock'; now searches 'mathInline' (free-caret rebuild).
 */
export function findBlock(editor: Editor, id: string): FoundBlock | null {
  let found: FoundBlock | null = null;
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'mathInline' && node.attrs.id === id) {
      found = { node, pos };
      return false;
    }
    return true;
  });
  return found;
}

/**
 * Merge layout/CAS fields onto a block via the Yjs blockMeta side-channel (CC-1).
 * No longer touches PM node attrs (those are structural only since Phase B).
 */
export function patchBlock(
  ydoc: Y.Doc | null,
  id: string,
  attrs: Partial<BlockMetaRecord>,
): void {
  patchBlockMeta(ydoc, id, attrs);
}

export function setBlockState(
  ydoc: Y.Doc | null,
  id: string,
  blockState: BlockState,
): void {
  patchBlockMeta(ydoc, id, { blockState });
}

/** Remove a block: delete the PM node and its blockMeta entry. */
export function deleteBlock(editor: Editor, ydoc: Y.Doc | null, id: string): void {
  const f = findBlock(editor, id);
  if (!f) return;
  editor.view.dispatch(editor.state.tr.delete(f.pos, f.pos + f.node.nodeSize));
  deleteBlockMeta(ydoc, id);
}

/**
 * Single eval path used by BOTH the NodeView (Shift+Enter) and the toolbar
 * (Tính / Tính lại). EVALUATING → mock CAS → result/error (state machine).
 * Reads/writes the block's latex + result via blockMeta (CC-1).
 */
export async function evalBlock(
  editor: Editor,
  ydoc: Y.Doc | null,
  id: string,
): Promise<void> {
  if (!findBlock(editor, id)) return;
  const latex = getBlockMeta(ydoc, id).latexContent;
  patchBlockMeta(ydoc, id, { blockState: 'evaluating', errorKind: '' });
  const res = await mockEval(latex);
  patchBlockMeta(ydoc, id, resultToAttrs(res));
}

/** Copy text to clipboard (best-effort; mock-UI). */
export function copyText(text: string): void {
  if (navigator.clipboard?.writeText) {
    void navigator.clipboard.writeText(text);
  }
}
