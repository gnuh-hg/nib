import { useEffect, useMemo, useRef, useState } from 'react';
import { useEditor } from '@tiptap/react';
import {
  NibDocument,
  NibParagraph,
  NibTextNode,
} from '@/editor/extensions/NibDocument';
import { SpacerAtom } from '@/editor/extensions/SpacerAtom';
import { VirtualCaret } from '@/editor/extensions/VirtualCaret';
import {
  setVirtualCaret,
  clearVirtualCaret,
  getVirtualCaret,
  MATERIALIZE_THRESHOLD,
  INACTIVE,
  virtualCaretKey,
} from '@/editor/virtualCaret';
import {
  materialize,
  materializeGap,
  isPrintableKey,
  findNextSpacer,
  shrinkOrDeleteSpacer,
  measureSpaceWidth,
  insertSpacer,
} from '@/editor/materializeInput';
import { TextSelection } from '@tiptap/pm/state';
import {
  tryMoveHorizontal,
  tryMoveVertical,
  resetGoalX,
} from '@/editor/arrowNav';
import { YjsSync } from '@/editor/extensions/YjsSync';
import '@/editor/spacer.css';
import {
  NibBold,
  NibItalic,
  NibUnderline,
  NibStrike,
} from '@/editor/extensions/marks';
import { EditorContext } from '@/editor/editor-context';
import { PROSEMIRROR_FRAGMENT, SPACER_WIDTHS_MAP } from '@/lib/yjs';
import { YjsProvider, useYjs } from '@/providers/YjsProvider';
import { useProfile } from '@/providers/ProfileProvider';
import { useContextualTips } from '@/hooks/useContextualTips';
import { TopStrip } from './TopStrip';
import { CommandPalette } from './CommandPalette';
import { UnifiedDock } from './UnifiedDock';
import { ContextualTip } from './ContextualTip';
import { Canvas } from './Canvas';
import type { DocEntry } from '@/types/doc';

interface WorkspaceProps {
  onOpenLibrary: () => void;
  onOpenSettings: () => void;
  onOpenLogin: () => void;
  docs: DocEntry[];
  activeDocId: string;
}

/**
 * Editor workspace shell.
 *
 * The free-caret typing/document layer (row/nibBlock schema, MathLive blocks,
 * caret-nav, clipboard serialization, block CAS meta) was wiped 2026-06-25 so a
 * fresh typing schema can be built from zero. What remains is the app shell:
 * TopStrip + an EMPTY editable Canvas (minimal Document/Paragraph/Text schema,
 * Yjs-synced) + the tool dock + command palette + contextual tips.
 *
 * TODO rebuild typing: reintroduce the block/math schema + interaction layer here.
 */
function WorkspaceEditor({
  onOpenLibrary,
  onOpenSettings,
  onOpenLogin,
  docs,
  activeDocId,
}: WorkspaceProps) {
  const { ydoc } = useYjs();
  const paperRef = useRef<HTMLDivElement>(null);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { tipKey, trigger, dismiss } = useContextualTips();

  // y-prosemirror binds the document to this shared fragment (collaborative sync
  // + CRDT undo via YjsSync). Content is driven by Yjs, NOT a TipTap `content`.
  const xmlFragment = useMemo(
    () => ydoc.getXmlFragment(PROSEMIRROR_FRAGMENT),
    [ydoc],
  );

  // Yjs side-channel for spacer-atom widths (Path B). Lives on the same Y.Doc as
  // the fragment so it persists/sync alongside the document (CC-1: width stays
  // off PM node attrs). SpacerAtom NodeViews read + observe this map.
  const spacerWidthMap = useMemo(
    () => ydoc.getMap<number>(SPACER_WIDTHS_MAP),
    [ydoc],
  );

  const editor = useEditor(
    {
      extensions: [
        NibDocument,
        NibParagraph,
        NibTextNode,
        SpacerAtom.configure({ spacerWidthMap }),
        VirtualCaret,
        YjsSync.configure({ xmlFragment }),
        NibBold,
        NibItalic,
        NibUnderline,
        NibStrike,
      ],
      editorProps: {
        attributes: { class: 'nib-pm', spellcheck: 'false' },
        // Click past a line's content-right activates the ephemeral virtual
        // caret at the clicked x; a normal click clears it. We return false so
        // ProseMirror still sets a VALID TextSelection(pos) itself — we never
        // setSelection manually (the core fix vs the old ghost-park crash).
        handleClick(view, pos, event) {
          if (pos < 1) return false; // E2: pos 0 = doc root, coordsAtPos throws
          const coords = view.coordsAtPos(pos);
          if (event.clientX > coords.right + MATERIALIZE_THRESHOLD) {
            const viewLeft = view.dom.getBoundingClientRect().left;
            // coords.right is the text right-edge measured NOW, before the caret
            // widget renders — pass it so materialize computes the gap correctly.
            setVirtualCaret(
              view,
              pos,
              event.clientX - viewLeft,
              event.clientX,
              coords.right,
            );
          } else if (getVirtualCaret(view.state).active) {
            clearVirtualCaret(view);
          }
          resetGoalX(); // a click defines a new column → forget the vertical goal
          return false;
        },
        // A printable keypress while the virtual caret is active materializes the
        // gap + the char in one tx; return true so PM does NOT also insert at its
        // own selection (which would land the char in the wrong place).
        handleKeyDown(view, event) {
          const vc = getVirtualCaret(view.state);

          // Arrow navigation (Session B.2) — handled in BOTH caret states. The
          // try* helpers branch internally on vc.active; horizontal arrows reset
          // the vertical goal column, vertical arrows preserve it. Returning the
          // helper's boolean lets PM fall back to its default when we decline.
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            resetGoalX();
            return tryMoveHorizontal(
              view,
              vc,
              event.key === 'ArrowLeft' ? 'left' : 'right',
            );
          }
          if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            return tryMoveVertical(view, vc, event.key === 'ArrowUp' ? 'up' : 'down');
          }

          // Tab inserts a 4×space-width spacer (Session B.3) — a DELIBERATE gap,
          // so (unlike materialize) it does NOT compensate a neighbour. Handled in
          // BOTH caret states. preventDefault stops the browser/PM focus tab-out.
          if (event.key === 'Tab') {
            event.preventDefault();
            const tabW = 4 * measureSpaceWidth(view);
            if (vc.active) {
              // Insert the tab spacer at the gap origin (lineDocPos). Its LEFT edge
              // renders at lineDocPos's x — captured as textRightClient (the line's
              // content right). A free-gap click does NOT materialize its offset
              // (model: space only materializes on input), so the caret lands at
              // the spacer's RIGHT edge = textRightClient + tabW, NOT the old click
              // x. State shape mirrors B.2 enterSpacerFromRight (lineDocPos = left
              // boundary, virtualX = right edge, textRight = left edge).
              const { tr } = insertSpacer(
                view.state.tr,
                view.state.schema,
                spacerWidthMap,
                vc.lineDocPos,
                tabW,
              );
              const viewLeft = view.dom.getBoundingClientRect().left;
              const caretX = vc.textRightClient + tabW;
              view.dispatch(
                tr.setMeta(virtualCaretKey, {
                  active: true,
                  lineDocPos: vc.lineDocPos,
                  virtualXClient: caretX,
                  virtualXEditorRelative: caretX - viewLeft,
                  textRightClient: vc.textRightClient,
                }),
              );
              return true;
            }
            // Plain PM cursor (not in a gap): insert at the cursor, land after it.
            const pos = view.state.selection.from;
            const { tr } = insertSpacer(
              view.state.tr,
              view.state.schema,
              spacerWidthMap,
              pos,
              tabW,
            );
            view.dispatch(tr.setSelection(TextSelection.near(tr.doc.resolve(pos + 1))));
            return true;
          }
          // Delete at a text↔spacer boundary is left to ProseMirror's default
          // forward-delete: a cursor immediately before a spacer_atom removes the
          // whole atom in ONE press → the two text runs merge (confirmed by the
          // B.3 Delete probe: count 1→0, "AA"+spacer+"BB" → "AABB"). Adding code
          // here would only diverge from the proven-correct default.

          if (!vc.active) return false;
          if (event.key === 'Escape') {
            clearVirtualCaret(view);
            return true;
          }
          // Backspace inside a gap (Session B.1, merge-side of the add-char/merge
          // law): shrink the spacer to the caret's right by one space-width — or
          // delete it (merge) when that empties it — and step the caret left by
          // the same amount. No real text to delete here; the gap IS the spacer.
          if (event.key === 'Backspace') {
            const spacer = findNextSpacer(view.state.doc, vc.lineDocPos);
            if (!spacer) {
              clearVirtualCaret(view);
              return true;
            }
            const spaceW = measureSpaceWidth(view);
            const oldWidth = spacerWidthMap.get(spacer.id) ?? 0;
            const newWidth = oldWidth - spaceW;
            let tr = view.state.tr;
            tr = shrinkOrDeleteSpacer(
              tr,
              spacerWidthMap,
              spacer.pos,
              spacer.nodeSize,
              spacer.id,
              spaceW,
            );
            tr =
              newWidth > 0
                ? tr.setMeta(virtualCaretKey, {
                    ...vc,
                    virtualXClient: vc.virtualXClient - spaceW,
                    virtualXEditorRelative: vc.virtualXEditorRelative - spaceW,
                  })
                : tr.setMeta(virtualCaretKey, INACTIVE);
            view.dispatch(tr);
            return true;
          }
          if (isPrintableKey(event)) {
            resetGoalX(); // typing breaks the vertical goal column
            materialize(view, spacerWidthMap, vc, event.key);
            return true;
          }
          // Enter still dismisses the caret (Tab handled above, Session B.3).
          if (event.key === 'Enter') {
            clearVirtualCaret(view);
          }
          return false;
        },
        handleDOMEvents: {
          // R3 (IME fix vs ghost-park): materialize the gap only, then return
          // false WITHOUT preventDefault so the browser's IME composes into the
          // now-valid PM selection rather than a parked invalid one.
          compositionstart(view) {
            const vc = getVirtualCaret(view.state);
            if (vc.active) materializeGap(view, spacerWidthMap, vc);
            return false;
          },
        },
      },
    },
    [xmlFragment, spacerWidthMap],
  );

  // Ctrl/Cmd+K command palette toggle.
  useEffect(() => {
    if (!editor) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editor]);

  const total = editor ? editor.state.doc.childCount : 0;

  const ctx = useMemo(
    () => ({
      ydoc,
      activeBlockId,
      setActiveBlockId,
      // No block NodeViews remain to report a render-time clamp.
      notifyClamped: () => {},
      onTipTrigger: trigger,
    }),
    [ydoc, activeBlockId, trigger],
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
              onPointerDown={() => {}}
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
      <ContextualTip tipKey={tipKey} onDismiss={dismiss} />
    </EditorContext.Provider>
  );
}

/**
 * Public workspace: wires the Yjs sync provider around the editor. docId = the
 * open document; userId/token come from the Supabase session — signed out →
 * token null → YjsProvider runs offline-only (IndexedDB, no WS). Keyed by docId
 * so switching documents rebinds to a fresh Y.Doc + editor.
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
