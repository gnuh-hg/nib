import { createContext, useContext } from 'react';
import type * as Y from 'yjs';

import type { TipTrigger } from '@/hooks/useContextualTips';

export interface EditorContextValue {
  /**
   * Active document's Y.Doc — source for block layout/CAS meta (CC-1 side-channel).
   * Null until Workspace wires <YjsProvider> in Session B.5; consumers tolerate
   * null (render DEFAULT_META, meta writes are no-ops).
   */
  ydoc: Y.Doc | null;
  /** Exactly one active block at a time — React state, NOT ProseMirror selection. */
  activeBlockId: string | null;
  setActiveBlockId: (id: string | null) => void;
  /** Called by a NodeView when render-time clamp actually moved a block. */
  notifyClamped: () => void;
  /** Fired by a block to maybe surface a contextual tip (quota-limited). */
  onTipTrigger: (trigger: TipTrigger) => void;
}

export const EditorContext = createContext<EditorContextValue | null>(null);

export function useEditorContext(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) {
    throw new Error(
      'useEditorContext must be used within <Workspace> EditorContext.Provider',
    );
  }
  return ctx;
}
