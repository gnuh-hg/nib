// Canvas spatial geometry (design.md §3). Keep these in sync with canvas.css.

/** Ruled line height — must equal --ruled-line-height (64px). */
export const RULE_HEIGHT = 64;

/**
 * Advance-width of one ASCII space character (px) at the editor's base font
 * size (~16px Inter).  Used by clipboard serializer to convert pixel indent↔
 * space count.  The conversion is intentionally lossy (±1 space) because Inter
 * is proportional; blankBefore (vertical) is exact.
 */
export const CHAR_W = 7;

/** Left margin inside the canvas usable area (ruled-paper left gutter, mock = 56px). */
export const MARGIN_L = 56;

/** Right margin mirror. */
export const MARGIN_R = 16;

export function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

/** Pointer (x,y) relative to canvas top-left → ruled-line index. */
export function lineIndexFromY(y: number): number {
  return Math.max(0, Math.floor(y / RULE_HEIGHT));
}

/** Pointer x relative to canvas left → authoring xOffset (px, never negative). */
export function xOffsetFromX(x: number): number {
  return Math.max(0, Math.round(x - MARGIN_L));
}

/**
 * Render-time clamp (design.md §3.1): keep the block inside the viewport.
 * Returns the X to paint — the stored xOffset is NEVER overwritten.
 */
export function clampRenderX(
  xOffset: number,
  blockWidth: number,
  usableWidth: number,
): number {
  const maxLeft = usableWidth - blockWidth - MARGIN_R;
  return clamp(xOffset, MARGIN_L, Math.max(MARGIN_L, maxLeft));
}

/**
 * True only when the block was pulled LEFTWARD below its authoring intent
 * because the viewport is narrower than where it was placed (right-overflow) —
 * i.e. the only case design.md §3.1 wants the "blocks moved into view" toast.
 *
 * Excludes: unmeasured layout (width ≤ 0, first render) and the left-margin
 * snap (xOffset < MARGIN_L moves the block RIGHT, which is normal placement).
 */
export function isClampedLeftward(
  xOffset: number,
  blockWidth: number,
  usableWidth: number,
): boolean {
  if (blockWidth <= 0 || usableWidth <= 0) return false;
  const left = clampRenderX(xOffset, blockWidth, usableWidth);
  return left < xOffset - 0.5;
}
