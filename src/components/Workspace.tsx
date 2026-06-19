import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type PointerEvent,
} from 'react';
import { useEditor, type JSONContent } from '@tiptap/react';
import { NibDocument } from '@/editor/extensions/NibDocument';
import { NibText } from '@/editor/extensions/NibText';
import { NibHistory } from '@/editor/extensions/NibHistory';
import { NibBlock } from '@/editor/extensions/NibBlock';
import {
  NibBold,
  NibItalic,
  NibUnderline,
  NibStrike,
} from '@/editor/extensions/marks';
import { EditorContext } from '@/editor/editor-context';
import { lineIndexFromY, xOffsetFromX } from '@/editor/geometry';
import { findBlock, deleteBlock, patchBlock } from '@/editor/blockActions';
import { useI18n } from '@/hooks/useI18n';
import { useContextualTips } from '@/hooks/useContextualTips';
import { TopStrip } from './TopStrip';
import { CommandPalette } from './CommandPalette';
import { UnifiedDock } from './UnifiedDock';
import { ContextualTip } from './ContextualTip';
import { SymbolMenu, type SymbolMenuItem } from './SymbolMenu';
import { Canvas } from './Canvas';
import type { BlockType } from '@/types/block';
import type { DocEntry } from '@/types/doc';

// Starter content (design.md §4.5): a demo math block already showing a result,
// so the user learns the block+result model. Fades out on first user block.
const STARTER_CONTENT: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'nibBlock',
      attrs: {
        id: 'starter-demo',
        lineIndex: 1,
        // Authoring intent = render position: xOffset 56 == MARGIN_L (left gutter).
        xOffset: 56,
        blockType: 'math',
        blockState: 'result-exact',
        latexContent: '\\int x^2\\,dx',
        exactLatex: '\\frac{x^3}{3}+C',
        isApprox: false,
        starter: true,
      },
    },
  ],
};

interface WorkspaceProps {
  onOpenLibrary: () => void;
  onOpenSettings: () => void;
  docs: DocEntry[];
  activeDocId: string;
}

/**
 * Editor workspace: owns the TipTap editor, the EditorContext provider and all
 * canvas interaction state. Layout (nav-dock-design §2/§3) = thin full-width
 * TopStrip on top, then the canvas stage below — the SidebarRail is gone; doc
 * quick-switch now lives in the strip's doc-title dropdown.
 *
 * CRITICAL: UnifiedDock + CommandPalette consume useEditorContext, so they MUST
 * stay inside <EditorContext.Provider> (architect risk) — they live after the
 * .nib-workspace div but still within the provider.
 */
export function Workspace({
  onOpenLibrary,
  onOpenSettings,
  docs,
  activeDocId,
}: WorkspaceProps) {
  const { t } = useI18n();
  const paperRef = useRef<HTMLDivElement>(null);
  const clampedRef = useRef(false);
  const starterDismissed = useRef(false);
  const lastPointer = useRef({ x: 120, y: 120 });

  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [showClampToast, setShowClampToast] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [symbolMenu, setSymbolMenu] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [, force] = useReducer((x: number) => x + 1, 0);
  const { tipKey, trigger, dismiss } = useContextualTips();

  const notifyClamped = useCallback(() => {
    if (clampedRef.current) return;
    clampedRef.current = true;
    setShowClampToast(true);
    window.setTimeout(() => setShowClampToast(false), 4000);
  }, []);

  const editor = useEditor({
    extensions: [
      NibDocument,
      NibText,
      NibHistory,
      NibBold,
      NibItalic,
      NibUnderline,
      NibStrike,
      NibBlock,
    ],
    content: STARTER_CONTENT,
    editorProps: {
      attributes: { class: 'nib-pm', spellcheck: 'false' },
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData('text/plain');
        if (text) {
          view.dispatch(view.state.tr.insertText(text));
          return true;
        }
        return false;
      },
    },
  });

  // Recompute ghost visibility on doc changes.
  useEffect(() => {
    if (!editor) return;
    const h = () => force();
    editor.on('transaction', h);
    return () => {
      editor.off('transaction', h);
    };
  }, [editor]);

  const dismissStarter = useCallback(() => {
    if (starterDismissed.current || !editor) return;
    starterDismissed.current = true;
    if (!findBlock(editor, 'starter-demo')) return;
    const el = document.querySelector('[data-block-id="starter-demo"]');
    el?.classList.add('nib-block--fading');
    window.setTimeout(() => deleteBlock(editor, 'starter-demo'), 260);
  }, [editor]);

  const coordsFromPointer = (clientX: number, clientY: number) => {
    // Coords are paper-relative (R6): xOffset/lineIndex measured from the sheet's
    // top-left, not the viewport-wide desk.
    const rect = paperRef.current!.getBoundingClientRect();
    return {
      lineIndex: lineIndexFromY(clientY - rect.top),
      xOffset: xOffsetFromX(clientX - rect.left),
    };
  };

  const createBlock = (
    clientX: number,
    clientY: number,
    blockType: BlockType,
    latex?: string,
  ) => {
    if (!editor) return;
    dismissStarter();
    const { lineIndex, xOffset } = coordsFromPointer(clientX, clientY);
    editor.chain().focus().insertNibBlock({ lineIndex, xOffset, blockType }).run();
    if (latex) {
      const last = editor.state.doc.lastChild;
      const id = last?.attrs.id as string | undefined;
      if (id) patchBlock(editor, id, { latexContent: latex });
    }
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!paperRef.current) return;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    if (!editor) return;
    const target = e.target as HTMLElement;
    if (target.closest('.nib-block')) return;
    createBlock(e.clientX, e.clientY, 'math');
  };

  // Ctrl/Cmd+K palette · `\` document-level symbol menu · Ctrl+Shift+M convert.
  useEffect(() => {
    if (!editor) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === 'm' &&
        activeBlockId
      ) {
        e.preventDefault();
        editor.commands.convertNibBlock(activeBlockId);
        return;
      }
      // `\` at document level (no active block) → symbol/insert menu.
      if (e.key === '\\' && !activeBlockId && !paletteOpen) {
        e.preventDefault();
        setSymbolMenu({ x: lastPointer.current.x, y: lastPointer.current.y });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editor, activeBlockId, paletteOpen]);

  const onSymbolPick = (item: SymbolMenuItem) => {
    createBlock(
      lastPointer.current.x,
      lastPointer.current.y,
      item.latex === null ? 'text' : 'math',
      item.latex ?? undefined,
    );
    setSymbolMenu(null);
  };

  const total = editor ? editor.state.doc.childCount : 0;

  const ctx = useMemo(
    () => ({ activeBlockId, setActiveBlockId, notifyClamped, onTipTrigger: trigger }),
    [activeBlockId, notifyClamped, trigger],
  );

  return (
    <EditorContext.Provider value={ctx}>
      <div className="nib-workspace">
        <TopStrip editor={editor} docs={docs} activeDocId={activeDocId} />
        <div className="nib-body">
          <div className="nib-stage">
            <Canvas
              editor={editor}
              paperRef={paperRef}
              onPointerDown={handlePointerDown}
              total={total}
            />
          </div>
        </div>
      </div>

      {/* Tool surface + portals — kept inside the provider (they consume
          useEditorContext). UnifiedDock portals to <body> itself. */}
      <UnifiedDock
        editor={editor}
        onOpenLibrary={onOpenLibrary}
        onOpenSettings={onOpenSettings}
      />

      <CommandPalette
        editor={editor}
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
      />
      {symbolMenu && (
        <SymbolMenu
          x={symbolMenu.x}
          y={symbolMenu.y}
          onPick={onSymbolPick}
          onClose={() => setSymbolMenu(null)}
        />
      )}
      <ContextualTip tipKey={tipKey} onDismiss={dismiss} />

      {showClampToast && (
        <div className="nib-toast" role="status">
          {t('app.blocks_clamped_notice')}
        </div>
      )}
    </EditorContext.Provider>
  );
}
