import { createContext, useContext } from 'react';

import type { TipTrigger } from '@/hooks/useContextualTips';

export interface EditorContextValue {
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
