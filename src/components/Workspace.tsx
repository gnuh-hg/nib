import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type PointerEvent,
} from 'react';
import { useEditor } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import type * as Y from 'yjs';
import { NibDocument } from '@/editor/extensions/NibDocument';
import { NibText } from '@/editor/extensions/NibText';
import { NibBlock } from '@/editor/extensions/NibBlock';
import { YjsSync } from '@/editor/extensions/YjsSync';
import {
  NibBold,
  NibItalic,
  NibUnderline,
  NibStrike,
} from '@/editor/extensions/marks';
import { EditorContext } from '@/editor/editor-context';
import { lineIndexFromY, xOffsetFromX } from '@/editor/geometry';
import { findBlock, deleteBlock, patchBlock } from '@/editor/blockActions';
import { initBlockMeta } from '@/editor/yBlockMeta';
import { PROSEMIRROR_FRAGMENT } from '@/lib/yjs';
import { YjsProvider, useYjs } from '@/providers/YjsProvider';
import { useProfile } from '@/providers/ProfileProvider';
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

interface WorkspaceProps {
  onOpenLibrary: () => void;
  onOpenSettings: () => void;
  onOpenLogin: () => void;
  docs: DocEntry[];
  activeDocId: string;
}

/**
 * Onboarding demo block (design.md §4.5): a math block already showing a result,
 * so the user learns the block+result model. Seeded into the Yjs doc once (when
 * the document is empty) — see `seedStarter` — because with y-prosemirror the
 * document content is driven by the shared Y.XmlFragment, not TipTap `content`.
 * Fades out on the user's first block.
 */
const STARTER_ID = 'starter-demo';

function seedStarter(editor: Editor, ydoc: Y.Doc): void {
  // Idempotent across devices: a CRDT flag guards re-seeding. If the doc already
  // has content (from IndexedDB or a remote peer), just mark it seeded.
  const docMeta = ydoc.getMap<boolean>('docMeta');
  if (docMeta.get('seeded')) return;
  const fragment = ydoc.getXmlFragment(PROSEMIRROR_FRAGMENT);
  if (fragment.length > 0) {
    docMeta.set('seeded', true);
    return;
  }
  docMeta.set('seeded', true);
  const node = editor.schema.nodes.nibBlock.create({
    id: STARTER_ID,
    blockType: 'math',
    starter: true,
  });
  editor.view.dispatch(editor.state.tr.insert(0, node));
  initBlockMeta(ydoc, STARTER_ID, {
    lineIndex: 1,
    // Authoring intent = render position: xOffset 56 == MARGIN_L (left gutter).
    xOffset: 56,
    blockState: 'result-exact',
    latexContent: '\\int x^2\\,dx',
    exactLatex: '\\frac{x^3}{3}+C',
    isApprox: false,
  });
}

/**
 * Editor workspace: owns the TipTap editor, the EditorContext provider and all
 * canvas interaction state. Wrapped by <YjsProvider> (see `Workspace`) so the
 * document syncs through Yjs (CRDT) with offline-first IndexedDB + Hocuspocus WS.
 *
 * CRITICAL: UnifiedDock + CommandPalette consume useEditorContext, so they MUST
 * stay inside <EditorContext.Provider> (architect risk) — they live after the
 * .nib-workspace div but still within the provider.
 */
function WorkspaceEditor({
  onOpenLibrary,
  onOpenSettings,
  onOpenLogin,
  docs,
  activeDocId,
}: WorkspaceProps) {
  const { t } = useI18n();
  const { ydoc } = useYjs();
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

  // y-prosemirror binds the document to this shared fragment (collaborative sync
  // + CRDT undo via YjsSync). Content is driven by Yjs, NOT a TipTap `content`.
  const xmlFragment = useMemo(
    () => ydoc.getXmlFragment(PROSEMIRROR_FRAGMENT),
    [ydoc],
  );

  const editor = useEditor(
    {
      extensions: [
        NibDocument,
        NibText,
        YjsSync.configure({ xmlFragment }),
        NibBold,
        NibItalic,
        NibUnderline,
        NibStrike,
        NibBlock,
      ],
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
    },
    [xmlFragment],
  );

  // Seed the onboarding starter once the editor is bound + local state hydrated.
  useEffect(() => {
    if (!editor) return;
    seedStarter(editor, ydoc);
  }, [editor, ydoc]);

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
    if (!findBlock(editor, STARTER_ID)) return;
    const el = document.querySelector(`[data-block-id="${STARTER_ID}"]`);
    el?.classList.add('nib-block--fading');
    window.setTimeout(() => deleteBlock(editor, ydoc, STARTER_ID), 260);
  }, [editor, ydoc]);

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
    // Layout (+ optional latex) lives in blockMeta now — initialise it for the
    // freshly inserted block so it renders at the pointer position.
    const last = editor.state.doc.lastChild;
    const id = last?.attrs.id as string | undefined;
    if (id) {
      initBlockMeta(ydoc, id, { lineIndex, xOffset });
      if (latex) patchBlock(ydoc, id, { latexContent: latex });
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
    () => ({ ydoc, activeBlockId, setActiveBlockId, notifyClamped, onTipTrigger: trigger }),
    [ydoc, activeBlockId, notifyClamped, trigger],
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
        onOpenLogin={onOpenLogin}
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

/**
 * Public workspace: wires the Yjs sync provider around the editor. docId = the
 * open document; userId/token come from the Supabase session (Phase A) — signed
 * out → token null → YjsProvider runs offline-only (IndexedDB, no WS). Keyed by
 * docId so switching documents rebinds to a fresh Y.Doc + editor.
 */
export function Workspace(props: WorkspaceProps) {
  const { session } = useProfile();
  const userId = session?.user.id ?? 'local';
  const token = session?.access_token ?? null;

  return (
    <YjsProvider
      key={props.activeDocId}
      docId={props.activeDocId}
      userId={userId}
      token={token}
    >
      <WorkspaceEditor {...props} />
    </YjsProvider>
  );
}
