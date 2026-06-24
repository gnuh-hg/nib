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
import { Row } from '@/editor/extensions/Row';
import { MathInline } from '@/editor/extensions/MathInline';
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
import { patchBlockMeta } from '@/editor/yBlockMeta';
import { PROSEMIRROR_FRAGMENT } from '@/lib/yjs';
import { patchRowMeta, deleteRowMeta } from '@/lib/yRowMeta';
import { MetaSyncPlugin } from '@/editor/extensions/MetaSyncPlugin';
import { handleClickOnPaper } from '@/editor/plugins/ghostCaret';
import { CaretNav } from '@/editor/plugins/caretNav';
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
 *
 * Phase B: creates a `row` containing a `mathInline` atom.
 * STARTER_ID is the mathInline atom id (used by findBlock / deleteBlock).
 */
const STARTER_ID = 'starter-demo';

function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const STARTER_ROW_ID = `${STARTER_ID}-row`;

function seedStarter(editor: Editor, ydoc: Y.Doc): void {
  // Multi-layer idempotency guard — seedStarter must never insert >1 starter row.
  //
  // Layer 1: Y.Doc flag (survives across peers / IDB reload).
  const docMeta = ydoc.getMap<boolean>('docMeta');
  if (docMeta.get('seeded')) return;

  // Layer 2: Yjs XmlFragment already has content (loaded from IDB async before this
  // effect ran, or a remote peer already seeded).
  const fragment = ydoc.getXmlFragment(PROSEMIRROR_FRAGMENT);
  if (fragment.length > 0) {
    docMeta.set('seeded', true);
    return;
  }

  // Layer 3: PM doc already has rows — catches React StrictMode double-effect where
  // the first effect run inserts the starter but the seeded Y.Doc flag may not have
  // propagated yet if YjsProvider created a fresh Y.Doc on the StrictMode remount.
  if (editor.state.doc.childCount > 0) {
    docMeta.set('seeded', true);
    return;
  }

  // Layer 4: explicit scan for the starter row ID in PM doc (belt+suspenders for the
  // StrictMode race where a new editor instance is paired with the same Y.Doc that
  // already received the insert from the first run).
  let starterAlreadyPresent = false;
  editor.state.doc.forEach((node) => {
    if (node.attrs.id === STARTER_ROW_ID) starterAlreadyPresent = true;
  });
  if (starterAlreadyPresent) {
    docMeta.set('seeded', true);
    return;
  }

  docMeta.set('seeded', true);

  // Phase B: row-based schema. The starter mathInline atom uses STARTER_ID so
  // dismissStarter() can find it via findBlock(editor, STARTER_ID).
  const mathAtom = editor.schema.nodes.mathInline?.create({ id: STARTER_ID });
  if (!mathAtom) return;
  const rowNode = editor.schema.nodes.row?.create({ id: STARTER_ROW_ID }, mathAtom);
  if (!rowNode) return;
  // Insert the row — MetaSyncPlugin appendTransaction auto-inits blockMeta/rowMeta
  // with DEFAULT values during this dispatch.
  editor.view.dispatch(editor.state.tr.insert(0, rowNode));

  // Doc now has ≥1 row → safe to focus (no "TextSelection endpoint not inline" throw).
  // This covers the common first-load path where IDB was empty and we seed the demo.
  editor.view.focus();

  // Patch with actual starter values AFTER dispatch (appendTransaction has already
  // created the entries idempotently with DEFAULT_META / DEFAULT_ROW_META).
  patchBlockMeta(ydoc, STARTER_ID, {
    blockState: 'result-exact',
    latexContent: '\\int x^2\\,dx',
    exactLatex: '\\frac{x^3}{3}+C',
    isApprox: false,
  });
  // Row position: blankBefore=1 line above, indent=56px (MARGIN_L gutter).
  patchRowMeta(ydoc, STARTER_ROW_ID, { blankBefore: 1, indent: 56 });
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
  // Phase C.2 (materialize-on-click): when the user clicks on empty paper a real
  // PM row is created immediately and the cursor is placed inside it.  If the user
  // clicks elsewhere or the editor blurs WITHOUT having typed anything, the empty
  // row is deleted (pendingEmptyRowId tracks it).
  const pendingEmptyRowId = useRef<string | null>(null);

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
        // Phase B: row-based schema (ARCHITECTURE.md §1).
        Row,
        MathInline,
        // Phase B.2: auto-init rowMeta + blockMeta on each PM transaction.
        MetaSyncPlugin.configure({ ydoc }),
        // Phase C.3: 2D arrow-nav (goalX) + Tab atom-jump.
        // setGhostPark no-op: ghost-park state removed in C.2 materialize-on-click.
        CaretNav.configure({ setGhostPark: () => {} }),
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

  // Auto-focus + MathLive artifact suppression.
  //
  // IMPORTANT: editor.view.focus() on an empty doc(row*) causes PM to throw
  // "TextSelection endpoint not pointing into a node with inline content" because
  // PM tries to ensure a valid selection when focusing.  We MUST guard every
  // focus call with doc.content.size > 0.
  //
  // Focus timing:
  //   - seedStarter calls focus() after inserting the starter row (common path).
  //   - The transaction listener below handles IDB hydration (doc arrives async).
  //   - The focusin listener here redirects ML artifact steals (doc may be non-empty
  //     by the time the steal happens).
  useEffect(() => {
    if (!editor) return;

    const isArtifact = (el: Element | null): boolean =>
      el !== null && (
        el.id === 'ML__fonts-did-not-load' ||
        el.classList.contains('ML__fonts-did-not-load')
      );

    // Safe focus: only when doc has ≥1 row (PM can place a valid inline selection).
    const safeFocus = () => {
      if (editor.isDestroyed) return;
      if (editor.state.doc.content.size > 0) editor.view.focus();
    };

    // Layer 1: suppress artifact from the tab order (tabindex=-1 blocks user Tab
    // traversal; programmatic .focus() can still land on it, hence Layer 2).
    const suppressArtifact = () => {
      const el = document.getElementById('ML__fonts-did-not-load');
      if (el && el.getAttribute('tabindex') !== '-1') {
        el.setAttribute('tabindex', '-1');
      }
    };
    suppressArtifact();

    // Watch for late-appended artifact nodes (MathLive may append after mount).
    const mo = new MutationObserver(suppressArtifact);
    mo.observe(document.body, { childList: true });

    // Layer 2: focusin listener — redirect artifact/body focus → editor.
    // Guard: only when doc has content (see above).
    const onFocusIn = (e: FocusEvent) => {
      const tgt = e.target as Element | null;
      if (isArtifact(tgt) || tgt === document.body || tgt === null) {
        safeFocus();
      }
    };
    document.addEventListener('focusin', onFocusIn);

    // Layer 3: attempt immediate focus (no-op if doc still empty at this point —
    // seedStarter or the transaction listener will focus once content arrives).
    safeFocus();

    return () => {
      document.removeEventListener('focusin', onFocusIn);
      mo.disconnect();
    };
  }, [editor]);

  // One-shot focus ref: once we auto-focus after content arrives, don't repeat
  // on every subsequent transaction (avoids stealing focus during user interaction).
  const autoFocusedOnContent = useRef(false);
  // Reset per editor instance.
  useEffect(() => { autoFocusedOnContent.current = false; }, [editor]);

  // Recompute on doc changes:
  //   1. Clear pendingEmptyRowId when the pending row receives content.
  //   2. One-shot auto-focus when doc transitions empty→content (IDB hydration:
  //      IndexeddbPersistence loads asynchronously; by the time the PM transaction
  //      fires the doc is non-empty and editor.view.focus() is safe).
  useEffect(() => {
    if (!editor) return;
    const h = () => {
      force();

      // Clear pendingEmptyRowId if the tracked row now has content (user typed).
      const rowId = pendingEmptyRowId.current;
      if (rowId) {
        editor.state.doc.forEach((node) => {
          if (node.attrs.id === rowId && node.textContent.length > 0) {
            pendingEmptyRowId.current = null;
          }
        });
      }

      // One-shot auto-focus after IDB hydration: seedStarter calls focus() on the
      // fresh-seed path, but if IDB loaded content BEFORE seedStarter ran (the
      // fragment.length > 0 early return), no focus was called yet.  Detect the
      // first transaction where doc becomes non-empty and we haven't focused yet.
      if (!autoFocusedOnContent.current && editor.state.doc.content.size > 0) {
        autoFocusedOnContent.current = true;
        const active = document.activeElement;
        const isArtifact =
          active?.id === 'ML__fonts-did-not-load' ||
          active?.classList.contains('ML__fonts-did-not-load');
        // Only focus if no real interactive element already has focus.
        if (!active || active === document.body || isArtifact) {
          if (!editor.isDestroyed) editor.view.focus();
        }
      }
    };
    editor.on('transaction', h);
    return () => { editor.off('transaction', h); };
  }, [editor]);

  const dismissStarter = useCallback(() => {
    if (starterDismissed.current || !editor) return;
    starterDismissed.current = true;
    if (!findBlock(editor, STARTER_ID)) return;
    const el = document.querySelector(`[data-block-id="${STARTER_ID}"]`);
    el?.classList.add('nib-block--fading');
    window.setTimeout(() => deleteBlock(editor, ydoc, STARTER_ID), 260);
  }, [editor, ydoc]);

  /**
   * Delete the pending empty row (if any) when the user clicks elsewhere or
   * the editor loses focus without having typed anything.
   * Checks PM doc state: if the row is still empty, deletes it + rowMeta.
   */
  const cleanupPendingEmptyRow = useCallback(() => {
    const rowId = pendingEmptyRowId.current;
    if (!rowId || !editor) return;
    pendingEmptyRowId.current = null;
    const doc = editor.state.doc;
    doc.forEach((node, pos) => {
      if (node.attrs.id === rowId && node.textContent.length === 0) {
        try {
          editor.view.dispatch(editor.state.tr.delete(pos, pos + node.nodeSize));
        } catch { /* defensive */ }
        deleteRowMeta(ydoc, rowId);
      }
    });
  }, [editor, ydoc]);

  // Clean up the pending empty row on editor blur (user left without typing).
  useEffect(() => {
    if (!editor) return;
    editor.on('blur', cleanupPendingEmptyRow);
    return () => { editor.off('blur', cleanupPendingEmptyRow); };
  }, [editor, cleanupPendingEmptyRow]);

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

    // Phase B: directly insert row + optional mathInline atom.
    // Command-based insertNibBlock is removed; caret/input UX arrives in Phase C/D.
    const rowId = genId();
    let rowNode;
    let mathId: string | null = null;

    if (blockType === 'math') {
      mathId = genId();
      const mathAtom = editor.schema.nodes.mathInline?.create({ id: mathId });
      rowNode = mathAtom
        ? editor.schema.nodes.row?.create({ id: rowId }, mathAtom)
        : editor.schema.nodes.row?.create({ id: rowId });
    } else {
      rowNode = editor.schema.nodes.row?.create({ id: rowId });
    }

    if (!rowNode) return;
    const pos = editor.state.doc.content.size;
    // Insert row — MetaSyncPlugin appendTransaction auto-inits rowMeta/blockMeta.
    editor.view.dispatch(editor.state.tr.insert(pos, rowNode));

    // Patch actual position on the ROW (not the atom — layout is row-scoped now).
    patchRowMeta(ydoc, rowId, { blankBefore: lineIndex, indent: xOffset });
    // Patch optional latex on the atom.
    if (mathId && latex) patchBlock(ydoc, mathId, { latexContent: latex });
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!paperRef.current || !editor) return;
    lastPointer.current = { x: e.clientX, y: e.clientY };

    // Clean up any empty row from a previous virtual click before handling this one.
    cleanupPendingEmptyRow();

    const target = e.target as HTMLElement;

    // Clicks inside an existing row → PM handles selection naturally (no new row).
    if (target.closest('.nib-row')) return;

    // Click on empty paper: classifyClick → materialize-on-click.
    // Also reset goalX (click resets 2D nav state per ARCHITECTURE.md §6).
    if (editor.storage?.caretNav) editor.storage.caretNav.goalX = null;
    const rect = paperRef.current.getBoundingClientRect();
    handleClickOnPaper(
      editor.view,
      editor,
      ydoc,
      e.clientX,
      e.clientY,
      rect,
      (rowId) => { pendingEmptyRowId.current = rowId; },
    );
  };

  // Ctrl/Cmd+K palette · `\` document-level symbol menu · Ctrl+Shift+M convert.
  // Ghost-park key interception is gone (materialize-on-click replaces it).
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
        // Phase B: convertNibBlock removed from schema. Convert command → Phase D.
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
