import './dock.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import type { Editor } from '@tiptap/react';
import { useI18n } from '@/hooks/useI18n';
import {
  IconCursor,
  IconPan,
  IconRectSelect,
  IconLasso,
  IconNib,
  IconMarker,
  IconEraser,
  IconStrokeSize,
  IconTextSize,
  IconConvert,
  IconCalc,
  IconDockCollapse,
  IconArrowLeft,
} from '../icons';
import { DragHandle } from './DragHandle';
import { NavLevel } from './NavLevel';
import { DockBtn } from './DockBtn';
import { CalcBtn } from './CalcBtn';
import { PointerFlyout } from './PointerFlyout';
import { SelectFlyout } from './SelectFlyout';
import { PenTypeFlyout } from './PenTypeFlyout';
import { SizeFlyout } from './SizeFlyout';
import { ColorFlyout } from './ColorFlyout';
import { FormatFlyout } from './FormatFlyout';
import {
  DOCK_MODE_KEY,
  DOCK_COLLAPSED_KEY,
  DOCK_POS_KEY,
  DEFAULT_LEVEL,
  navSelect,
  backToNav,
  togglePop,
  isFormatVisible,
  sizeTitleKey,
  parseMode,
  parseCollapsed,
  parsePos,
  clampPos,
  expandDirection,
  flyoutTop,
  FLYOUT_HEIGHTS,
  type DockMode,
  type DockLevel,
  type DockPos,
  type ExpandDir,
  type PtrTool,
  type SelTool,
  type PenTool,
  type PenSize,
  type PopKey,
} from './dockState';

export type {
  DockMode,
  DockPos,
  ExpandDir,
  PtrTool,
  SelTool,
  PenTool,
  PenSize,
  PopKey,
} from './dockState';

/** Pointer movement (px, Manhattan) below which a collapsed press = tap, not drag. */
const TAP_THRESHOLD = 4;

export interface UnifiedDockProps {
  editor: Editor | null;
  /** Open the Library overlay from the NAV [Library] button (S1.3 wiring). */
  onOpenLibrary?: () => void;
  /** Open the Settings overlay from the NAV [Settings] button. */
  onOpenSettings?: () => void;
  /** Open the LoginModal from the NAV account chip (when signed out). */
  onOpenLogin?: () => void;
}

function readMode(): DockMode {
  if (typeof window === 'undefined') return 'pen';
  return parseMode(localStorage.getItem(DOCK_MODE_KEY));
}
function readCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  return parseCollapsed(localStorage.getItem(DOCK_COLLAPSED_KEY));
}
function readPos(): DockPos {
  const vw = typeof window === 'undefined' ? 1280 : window.innerWidth;
  const raw = typeof window === 'undefined' ? null : localStorage.getItem(DOCK_POS_KEY);
  return parsePos(raw, vw);
}

const PEN_ICONS: Record<PenTool, typeof IconNib> = {
  nib: IconNib,
  marker: IconMarker,
  eraser: IconEraser,
};

/**
 * Unified vertical tool dock (PLAN dock-v2). Source of truth =
 * docs/Nib-Dock-v2-ref.html (DCLogic renderVals). Local state machine +
 * flyout/collapse animations + persistence (Session 1.2). Session 2.1 wires
 * Tính → evalBlock, Convert → convertNibBlock, Format → toggleMark on the real
 * editor. Pen/size/color stay local UI state (no real ink in Phase 0).
 */
export function UnifiedDock({
  editor,
  onOpenLibrary,
  onOpenSettings,
  onOpenLogin,
}: UnifiedDockProps) {
  const { t } = useI18n();

  const [mode, setMode] = useState<DockMode>(readMode);
  // Drill-down level — in-memory only, always starts at NAV (S1.1 Q1, not persisted).
  const [level, setLevel] = useState<DockLevel>(DEFAULT_LEVEL);
  const [collapsed, setCollapsed] = useState<boolean>(readCollapsed);
  const [openPop, setOpenPop] = useState<PopKey | null>(null);
  const [ptrTool, setPtrTool] = useState<PtrTool>('cursor');
  const [selTool, setSelTool] = useState<SelTool>('rect');
  const [penTool, setPenTool] = useState<PenTool>('nib');
  const [penSize, setPenSize] = useState<PenSize>(4);
  const [inkColor, setInkColor] = useState<string>('teal');
  const [pos, setPos] = useState<DockPos>(readPos);
  const [isDragging, setIsDragging] = useState(false);
  const [expandDir, setExpandDir] = useState<ExpandDir>('down');
  const [flyoutStyle, setFlyoutStyle] = useState<Partial<Record<PopKey, CSSProperties>>>(
    {},
  );

  const dockRef = useRef<HTMLDivElement>(null);
  const expandedRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Partial<Record<PopKey, HTMLButtonElement | null>>>({});
  // Drag origin (pointer + dock pos at press) and max travel since press.
  const dragOrigin = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const dragMoved = useRef(0);
  // Mirror latest pos in a ref so stable callbacks (doExpand) read it without re-creating.
  const posRef = useRef(pos);
  useEffect(() => {
    posRef.current = pos;
  }, [pos]);
  const isPen = mode === 'pen';

  // Persist mode + collapsed (PLAN §c).
  useEffect(() => {
    localStorage.setItem(DOCK_MODE_KEY, mode);
  }, [mode]);
  useEffect(() => {
    localStorage.setItem(DOCK_COLLAPSED_KEY, String(collapsed));
  }, [collapsed]);
  // Persist position whenever it settles (after a drag, after a resize re-clamp).
  useEffect(() => {
    if (isDragging) return;
    localStorage.setItem(DOCK_POS_KEY, JSON.stringify(pos));
  }, [pos, isDragging]);

  // Re-clamp into the viewport on window resize.
  useEffect(() => {
    const onResize = () =>
      setPos((p) => clampPos(p.x, p.y, window.innerWidth, window.innerHeight));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Close the open flyout on pointerdown outside the dock (PLAN §c).
  useEffect(() => {
    if (openPop === null) return;
    const onDown = (e: PointerEvent) => {
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) {
        setOpenPop(null);
      }
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [openPop]);

  // NAV → TOOLS entry points (replace the deleted ModeToggle). [Type]/[Write] set
  // the single source-of-truth mode and drill into the tool set.
  const goType = useCallback(() => {
    const { mode: m, level: l } = navSelect('type');
    setMode(m);
    setLevel(l);
    setOpenPop(null);
  }, []);
  const goWrite = useCallback(() => {
    const { mode: m, level: l } = navSelect('write');
    setMode(m);
    setLevel(l);
    setOpenPop(null);
  }, []);
  // TOOLS → NAV drill-up (Back button).
  const goBack = useCallback(() => {
    setLevel(backToNav());
    setOpenPop(null);
  }, []);
  // Library / Settings wired in S1.3; Help still a placeholder.
  const onLibrary = useCallback(() => {
    onOpenLibrary?.();
    setOpenPop(null);
  }, [onOpenLibrary]);
  const onSettings = useCallback(() => {
    onOpenSettings?.();
    setOpenPop(null);
  }, [onOpenSettings]);
  const onAccount = useCallback(() => {
    onOpenLogin?.();
    setOpenPop(null);
  }, [onOpenLogin]);
  const navPlaceholder = useCallback(() => {
    /* TODO: wire Help. */
  }, []);
  // Toggle a flyout; when opening, measure its overflow-aware top vs viewport.
  const tog = useCallback(
    (k: PopKey) => () => {
      const btn = btnRefs.current[k];
      const exp = expandedRef.current;
      if (btn && exp) {
        const b = btn.getBoundingClientRect();
        const e = exp.getBoundingClientRect();
        const topRel = b.top - e.top;
        const top = flyoutTop(
          topRel,
          e.top,
          b.height,
          FLYOUT_HEIGHTS[k],
          window.innerHeight,
        );
        setFlyoutStyle((s) => ({ ...s, [k]: { top } }));
      }
      setOpenPop((p) => togglePop(p, k));
    },
    [],
  );
  const doCollapse = useCallback(() => {
    setCollapsed(true);
    setOpenPop(null);
  }, []);
  // Expand, choosing direction from free space below the anchor (PLAN §3.2).
  const doExpand = useCallback(() => {
    setExpandDir(expandDirection(posRef.current.y, window.innerHeight));
    setCollapsed(false);
  }, []);

  const pickPtr = useCallback((tool: PtrTool) => {
    setPtrTool(tool);
    setOpenPop(null);
  }, []);
  const pickSel = useCallback((tool: SelTool) => {
    setSelTool(tool);
    setOpenPop(null);
  }, []);
  const pickPen = useCallback((tool: PenTool) => {
    setPenTool(tool);
    setOpenPop(null);
  }, []);
  const pickSize = useCallback((size: PenSize) => {
    setPenSize(size);
    setOpenPop(null);
  }, []);
  const pickColor = useCallback((color: string) => {
    setInkColor(color);
    setOpenPop(null);
  }, []);

  // ── Drag-to-reposition (Session 3.1) ──
  const onDragStart = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      dragOrigin.current = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y };
      dragMoved.current = 0;
      setIsDragging(true);
    },
    [pos],
  );
  const onDragMove = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    const o = dragOrigin.current;
    if (!o) return;
    const dx = e.clientX - o.px;
    const dy = e.clientY - o.py;
    dragMoved.current = Math.max(dragMoved.current, Math.abs(dx) + Math.abs(dy));
    setPos(clampPos(o.x + dx, o.y + dy, window.innerWidth, window.innerHeight));
  }, []);
  // DragHandle end: just finalize the drag (no expand).
  const onDragEnd = useCallback(() => {
    if (!dragOrigin.current) return;
    dragOrigin.current = null;
    setIsDragging(false);
  }, []);
  // Collapsed square end: a near-zero travel press is a tap → expand.
  const onCollapsedEnd = useCallback(() => {
    if (!dragOrigin.current) return;
    const tapped = dragMoved.current < TAP_THRESHOLD;
    dragOrigin.current = null;
    setIsDragging(false);
    if (tapped) doExpand();
  }, [doExpand]);

  // Editor-affecting actions. TODO rebuild typing: wire Calc/Convert once the new
  // schema + CAS pipeline exist. Stubbed no-ops keep the dock shell intact.
  const onCalc = useCallback(() => {}, []);
  const onConvert = useCallback(() => {}, []);

  const PenIcon = PEN_ICONS[penTool];

  return createPortal(
    <div
      className="nib-dock-anchor"
      style={{ left: pos.x, top: pos.y }}
      data-dragging={isDragging || undefined}
      ref={dockRef}
    >
      {/* ── Expanded shell ── */}
      <div
        ref={expandedRef}
        className="nib-dock__expanded"
        data-collapsed={collapsed || undefined}
        data-expand-up={expandDir === 'up' || undefined}
        aria-label={t('dock.label')}
        aria-hidden={collapsed}
      >
        <DragHandle
          title={t('dock.drag_handle')}
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
        />
        <span className="nib-dock__divider nib-dock__divider--wide" aria-hidden="true" />

        {/* Drill-down body — remounts on level change for the fade (S1.1 Q2). */}
        <div className="nib-dock__level" data-level={level} key={level}>
          {level === 'nav' ? (
            <NavLevel
              t={t}
              onLibrary={onLibrary}
              onSettings={onSettings}
              onType={goType}
              onWrite={goWrite}
              onHelp={navPlaceholder}
              onAccount={onAccount}
            />
          ) : (
            <>
              {/* Back — drill up to NAV (always meaningful at TOOLS level). */}
              <button
                type="button"
                className="nib-dock__back"
                title={t('dock.back')}
                aria-label={t('dock.back')}
                onClick={goBack}
              >
                <IconArrowLeft width={18} height={18} />
              </button>

              <span className="nib-dock__divider" aria-hidden="true" />

              {/* Pointer + Selection — always shown in both modes (HTML v2). */}
              <DockBtn
                title={t('dock.ptr_title')}
                active={openPop === 'ptr'}
                onClick={tog('ptr')}
                btnRef={(el) => (btnRefs.current.ptr = el)}
              >
                {ptrTool === 'cursor' ? (
                  <IconCursor width={17} height={17} />
                ) : (
                  <IconPan width={17} height={17} />
                )}
              </DockBtn>
              <DockBtn
                title={t('dock.sel_title')}
                active={openPop === 'sel'}
                onClick={tog('sel')}
                btnRef={(el) => (btnRefs.current.sel = el)}
              >
                {selTool === 'rect' ? (
                  <IconRectSelect width={17} height={17} />
                ) : (
                  <IconLasso width={17} height={17} />
                )}
              </DockBtn>
              <DockBtn
                title={t('dock.pen_title')}
                active={openPop === 'pen'}
                onClick={tog('pen')}
                btnRef={(el) => (btnRefs.current.pen = el)}
              >
                <PenIcon width={17} height={17} />
              </DockBtn>

              <span className="nib-dock__divider" aria-hidden="true" />

              <DockBtn
                title={t(sizeTitleKey(mode))}
                active={openPop === 'size'}
                onClick={tog('size')}
                btnRef={(el) => (btnRefs.current.size = el)}
              >
                {isPen ? (
                  <IconStrokeSize width={18} height={18} />
                ) : (
                  <IconTextSize width={17} height={17} />
                )}
              </DockBtn>
              <DockBtn
                title={t('dock.color_ink')}
                active={openPop === 'color'}
                onClick={tog('color')}
                btnRef={(el) => (btnRefs.current.color = el)}
              >
                <span className="nib-dock__color-dot" aria-hidden="true" />
              </DockBtn>

              <span className="nib-dock__divider" aria-hidden="true" />

              {/* Convert — toggle math ↔ text on the active block. */}
              <button
                type="button"
                className="nib-dock__btn nib-dock__btn--convert"
                title={t('dock.convert')}
                aria-label={t('dock.convert')}
                onClick={onConvert}
              >
                <IconConvert width={16} height={16} />
              </button>

              {/* Format button — slides in only in type mode (HTML v2). */}
              <div
                className="nib-dock__format"
                data-visible={isFormatVisible(mode) || undefined}
              >
                <DockBtn
                  title={t('dock.format')}
                  active={openPop === 'fmt'}
                  onClick={tog('fmt')}
                  btnRef={(el) => (btnRefs.current.fmt = el)}
                >
                  <span className="nib-dock__format-glyph">T</span>
                </DockBtn>
              </div>

              <span className="nib-dock__divider" aria-hidden="true" />

              <CalcBtn title={t('dock.calc')} onClick={onCalc}>
                <IconCalc width={20} height={20} />
              </CalcBtn>

              {/* ── Flyouts (top is overflow-aware, computed in tog()) ── */}
              <PointerFlyout
                open={openPop === 'ptr'}
                tool={ptrTool}
                onPick={pickPtr}
                style={flyoutStyle.ptr}
              />
              <SelectFlyout
                open={openPop === 'sel'}
                tool={selTool}
                onPick={pickSel}
                style={flyoutStyle.sel}
              />
              <PenTypeFlyout
                open={openPop === 'pen'}
                mode={mode}
                tool={penTool}
                onPick={pickPen}
                style={flyoutStyle.pen}
              />
              <SizeFlyout
                open={openPop === 'size'}
                mode={mode}
                penSize={penSize}
                onPick={pickSize}
                style={flyoutStyle.size}
              />
              <ColorFlyout
                open={openPop === 'color'}
                color={inkColor}
                onPick={pickColor}
                style={flyoutStyle.color}
              />
              <FormatFlyout open={openPop === 'fmt'} editor={editor} style={flyoutStyle.fmt} />
            </>
          )}
        </div>

        {/* Collapse — available at every level (S1.1 collapse requirement). */}
        <button
          type="button"
          className="nib-dock__collapse"
          title={t('dock.collapse')}
          aria-label={t('dock.collapse')}
          onClick={doCollapse}
        >
          <IconDockCollapse width={14} height={14} />
        </button>
      </div>

      {/* ── Collapsed square — draggable; a tap (no drag) expands ── */}
      <button
        type="button"
        className="nib-dock__collapsed"
        data-collapsed={collapsed || undefined}
        title={t('dock.expand')}
        aria-label={t('dock.expand')}
        aria-hidden={!collapsed}
        tabIndex={collapsed ? 0 : -1}
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onCollapsedEnd}
        onPointerCancel={onDragEnd}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            doExpand();
          }
        }}
      >
        <span className="nib-dock__collapsed-icon" aria-hidden="true">
          <PenIcon width={17} height={17} />
        </span>
      </button>
    </div>,
    document.body,
  );
}
