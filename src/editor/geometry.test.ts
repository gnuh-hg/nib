import { describe, it, expect } from 'vitest';
import {
  RULE_HEIGHT,
  MARGIN_L,
  clamp,
  lineIndexFromY,
  xOffsetFromX,
  clampRenderX,
  isClampedLeftward,
} from './geometry';

describe('canvas geometry', () => {
  it('ruled line height is 64px (in sync with --ruled-line-height)', () => {
    expect(RULE_HEIGHT).toBe(64);
  });

  it('lineIndexFromY maps pointer Y to the ruled-line index', () => {
    expect(lineIndexFromY(0)).toBe(0);
    expect(lineIndexFromY(63)).toBe(0);
    expect(lineIndexFromY(64)).toBe(1);
    expect(lineIndexFromY(260)).toBe(4); // floor(260/64) = 4
    expect(lineIndexFromY(-10)).toBe(0); // never negative
  });

  it('xOffsetFromX subtracts the left margin and never goes negative', () => {
    expect(xOffsetFromX(MARGIN_L + 40)).toBe(40);
    expect(xOffsetFromX(5)).toBe(0); // 5 - MARGIN_L < 0 → clamped to 0
  });

  it('clamp keeps a value inside [min, max]', () => {
    expect(clamp(50, 0, 100)).toBe(50);
    expect(clamp(-5, 0, 100)).toBe(0);
    expect(clamp(150, 0, 100)).toBe(100);
    expect(clamp(50, 100, 0)).toBe(100); // max<min → min
  });

  it('clampRenderX pulls a block back inside the usable width', () => {
    // block fits (xOffset ≥ marginL) → render at its xOffset
    expect(clampRenderX(80, 200, 1000)).toBe(80);
    // block would overflow right edge → shift left to usableW - blockW - marginR
    // 1000 - 300 - 16 = 684
    expect(clampRenderX(900, 300, 1000)).toBe(684);
    // xOffset below left margin → snap to marginL
    expect(clampRenderX(2, 100, 1000)).toBe(MARGIN_L);
  });
});

describe('isClampedLeftward (clamp-toast condition — bug #9)', () => {
  it('does NOT fire on unmeasured first render (width 0)', () => {
    expect(isClampedLeftward(40, 0, 0)).toBe(false);
    expect(isClampedLeftward(40, 0, 1300)).toBe(false);
    expect(isClampedLeftward(40, 80, 0)).toBe(false);
  });

  it('does NOT fire for the left-margin snap (xOffset < MARGIN_L moves RIGHT)', () => {
    // starter block xOffset 40 < MARGIN_L 56 → snaps to 56 (rightward) → no toast
    expect(isClampedLeftward(40, 80, 1300)).toBe(false);
  });

  it('does NOT fire when the block fits comfortably', () => {
    expect(isClampedLeftward(120, 200, 1300)).toBe(false);
  });

  it('DOES fire when a wide-doc block overflows a narrow viewport (real clamp)', () => {
    // xOffset 1300 on a 900px canvas, block 100px → maxLeft 784 < 1300 → pulled left
    expect(isClampedLeftward(1300, 100, 900)).toBe(true);
  });
});
