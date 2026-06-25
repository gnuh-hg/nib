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
} from '@/editor/virtualCaret';
import { materialize, materializeGap, isPrintableKey } from '@/editor/materializeInput';
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
          return false;
        },
        // A printable keypress while the virtual caret is active materializes the
        // gap + the char in one tx; return true so PM does NOT also insert at its
        // own selection (which would land the char in the wrong place).
        handleKeyDown(view, event) {
          const vc = getVirtualCaret(view.state);
          if (!vc.active) return false;
          if (event.key === 'Escape') {
            clearVirtualCaret(view);
            return true;
          }
          if (isPrintableKey(event)) {
            materialize(view, spacerWidthMap, vc, event.key);
            return true;
          }
          // Phase A: arrows / Enter / Tab just dismiss the caret (real nav = Phase B).
          if (
            ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'Tab'].includes(
              event.key,
            )
          ) {
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
