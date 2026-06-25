import { Extension } from '@tiptap/core';
import { createVirtualCaretPlugin } from '@/editor/virtualCaret';

/**
 * TipTap wrapper that drops the virtual-caret ProseMirror plugin into the editor
 * pipeline (ARCHITECTURE.md §A.2). It owns no logic — click handling and (later)
 * materialize live in Workspace's editorProps; this extension only registers the
 * plugin that holds the ephemeral caret state + draws the decoration.
 */
export const VirtualCaret = Extension.create({
  name: 'VirtualCaret',

  addProseMirrorPlugins() {
    return [createVirtualCaretPlugin()];
  },
});
