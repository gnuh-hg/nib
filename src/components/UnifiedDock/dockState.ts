/**
 * Pure state helpers for UnifiedDock (PLAN dock-v2 §c/§f). Kept out of the
 * component so the state-machine transitions are unit-testable without a DOM.
 * Source of truth = docs/Nib-Dock-v2-ref.html (DCLogic state + renderVals).
 */

export type DockMode = 'pen' | 'type';
/** Drill-down level (nav-dock-design §1): NAV (app nav) → TOOLS (per-mode tools). */
export type DockLevel = 'nav' | 'tools';
export type NavButton = 'type' | 'write';
export type PtrTool = 'cursor' | 'pan';
export type SelTool = 'rect' | 'lasso';
export type PenTool = 'nib' | 'marker' | 'eraser';
export type PenSize = 2 | 4 | 6;
export type PopKey = 'ptr' | 'sel' | 'pen' | 'size' | 'color' | 'fmt';
export type ExpandDir = 'down' | 'up';
export interface DockPos {
  x: number;
  y: number;
}

/** Expanded shell height (px) — used to pick expand direction. */
export const DOCK_EXPANDED_H = 460;

/** Estimated flyout heights (px) for overflow-aware flip (PLAN Phase 3). */
export const FLYOUT_HEIGHTS: Record<PopKey, number> = {
  ptr: 90,
  sel: 90,
  pen: 130,
  size: 115,
  color: 130,
  fmt: 90,
};

export const DOCK_MODE_KEY = 'nib-dock-mode';
export const DOCK_COLLAPSED_KEY = 'nib-dock-collapsed';
export const DOCK_POS_KEY = 'nib-dock-pos';

/** Anchor footprint = collapsed square (56×56). */
export const DOCK_ANCHOR_SIZE = 56;

/** Default anchor position: top-right corner (matches old right:14 / top:14). */
export function defaultPos(vw: number): DockPos {
  return { x: Math.max(0, vw - DOCK_ANCHOR_SIZE - 14), y: 14 };
}

/**
 * Clamp the anchor's top-left so the 56×56 square stays inside the viewport.
 * x ∈ [0, vw-56], y ∈ [0, vh-56]. Pure → unit-testable.
 */
export function clampPos(x: number, y: number, vw: number, vh: number): DockPos {
  const maxX = Math.max(0, vw - DOCK_ANCHOR_SIZE);
  const maxY = Math.max(0, vh - DOCK_ANCHOR_SIZE);
  return {
    x: Math.min(Math.max(0, x), maxX),
    y: Math.min(Math.max(0, y), maxY),
  };
}

/** Parse persisted position JSON; fall back to the top-right default. */
export function parsePos(raw: string | null, vw: number): DockPos {
  if (raw) {
    try {
      const v = JSON.parse(raw) as unknown;
      if (
        v &&
        typeof v === 'object' &&
        typeof (v as DockPos).x === 'number' &&
        typeof (v as DockPos).y === 'number' &&
        Number.isFinite((v as DockPos).x) &&
        Number.isFinite((v as DockPos).y)
      ) {
        return { x: (v as DockPos).x, y: (v as DockPos).y };
      }
    } catch {
      /* fall through to default */
    }
  }
  return defaultPos(vw);
}

/** cycleMode: pen ↔ type. */
export function toggleMode(mode: DockMode): DockMode {
  return mode === 'type' ? 'pen' : 'type';
}

/**
 * Drill-down default level (nav-dock-design §1). In-memory only — startup always
 * returns to NAV for easy orientation (not persisted, per S1.1 decision Q1).
 */
export const DEFAULT_LEVEL: DockLevel = 'nav';

/**
 * NAV → TOOLS entry: pressing [Type]/[Write] sets the single source-of-truth mode
 * and drills into the tool set. type → type mode, write → pen mode. Pure → testable.
 */
export function navSelect(btn: NavButton): { mode: DockMode; level: DockLevel } {
  return { mode: btn === 'type' ? 'type' : 'pen', level: 'tools' };
}

/** TOOLS → NAV drill-up (the Back button). */
export function backToNav(): DockLevel {
  return 'nav';
}

/** tog(k): open the flyout, or close it if it was already open. */
export function togglePop(current: PopKey | null, key: PopKey): PopKey | null {
  return current === key ? null : key;
}

/** Format button slides in only in type mode (HTML v2). */
export function isFormatVisible(mode: DockMode): boolean {
  return mode === 'type';
}

/** Stroke-eraser row renders only in pen mode (HTML v2). */
export function isEraserVisible(mode: DockMode): boolean {
  return mode === 'pen';
}

/** Size flyout title key depends on mode. */
export function sizeTitleKey(mode: DockMode): 'dock.size_stroke' | 'dock.size_font' {
  return mode === 'pen' ? 'dock.size_stroke' : 'dock.size_font';
}

export function parseMode(raw: string | null): DockMode {
  return raw === 'type' ? 'type' : 'pen';
}

export function parseCollapsed(raw: string | null): boolean {
  return raw === 'true';
}

/**
 * Pick expand direction from free space below the anchor (PLAN Phase 3): expand
 * down if the full 460px shell fits below pos.y, else expand up.
 */
export function expandDirection(posY: number, vh: number): ExpandDir {
  return vh - posY >= DOCK_EXPANDED_H ? 'down' : 'up';
}

/**
 * Overflow-aware flyout top (relative to the expanded shell). Open downward at
 * the button row; if that would clip the viewport bottom (8px margin), flip up
 * so the flyout ends at the button bottom — clamped so it never goes above the
 * shell top. All inputs measured DOM rects → pure & testable.
 */
export function flyoutTop(
  topRel: number,
  expTop: number,
  btnH: number,
  flyoutH: number,
  vh: number,
): number {
  const fitsDown = expTop + topRel + flyoutH < vh - 8;
  if (fitsDown) return topRel;
  return Math.max(0, topRel + btnH - flyoutH);
}
