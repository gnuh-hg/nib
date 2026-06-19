import type { Editor } from '@tiptap/react';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { mockEval } from '@/services/mockCAS';
import { resultToAttrs } from './evalResult';
import type { BlockState, NibBlockAttrs } from '@/types/block';

export interface FoundBlock {
  node: ProseMirrorNode;
  pos: number;
}

/** Locate a nibBlock by its id attr. */
export function findBlock(editor: Editor, id: string): FoundBlock | null {
  let found: FoundBlock | null = null;
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'nibBlock' && node.attrs.id === id) {
      found = { node, pos };
      return false;
    }
    return true;
  });
  return found;
}

/** Merge attrs onto a block (preserves content). */
export function patchBlock(
  editor: Editor,
  id: string,
  attrs: Partial<NibBlockAttrs>,
): void {
  const f = findBlock(editor, id);
  if (!f) return;
  const tr = editor.state.tr.setNodeMarkup(f.pos, undefined, {
    ...f.node.attrs,
    ...attrs,
  });
  editor.view.dispatch(tr);
}

export function setBlockState(
  editor: Editor,
  id: string,
  blockState: BlockState,
): void {
  patchBlock(editor, id, { blockState });
}

export function deleteBlock(editor: Editor, id: string): void {
  const f = findBlock(editor, id);
  if (!f) return;
  editor.view.dispatch(
    editor.state.tr.delete(f.pos, f.pos + f.node.nodeSize),
  );
}

/**
 * Single eval path used by BOTH the NodeView (Shift+Enter) and the toolbar
 * (Tính / Tính lại). EVALUATING → mock CAS → result/error (state machine).
 */
export async function evalBlock(editor: Editor, id: string): Promise<void> {
  const f = findBlock(editor, id);
  if (!f) return;
  const latex = (f.node.attrs.latexContent as string) ?? '';
  patchBlock(editor, id, { blockState: 'evaluating', errorKind: '' });
  const res = await mockEval(latex);
  patchBlock(editor, id, resultToAttrs(res));
}

/** Copy text to clipboard (best-effort; mock-UI). */
export function copyText(text: string): void {
  if (navigator.clipboard?.writeText) {
    void navigator.clipboard.writeText(text);
  }
}
