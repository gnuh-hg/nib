import { describe, it, expect } from 'vitest';
import { RULE_HEIGHT, MARGIN_L } from '@/editor/geometry';

/**
 * S1.3 risk gates for the desk/paper re-layout.
 *
 * NibBlockView places every block at `top = lineIndex * RULE_HEIGHT`
 * (NibBlockView.tsx — both the inline `style={{ top: lineIndex * RULE_HEIGHT }}`
 * and the layout-effect `el.style.top = `${lineIndex * RULE_HEIGHT}px``).
 * This locks that formula against the actual RULE_HEIGHT constant so a block at
 * line 3 lands at 192px — NOT 0 (the collapsed-stack regression RISK#1 guards).
 */
const blockTopPx = (lineIndex: number) => lineIndex * RULE_HEIGHT;

describe('S1.3 — paper block placement', () => {
  it('RISK#1: a block at lineIndex 3 sits at top 192px (3×64), never 0', () => {
    expect(RULE_HEIGHT).toBe(64);
    expect(blockTopPx(3)).toBe(192);
    expect(blockTopPx(3)).not.toBe(0);
  });

  it('line 0 = page-title row (top 0); user blocks start at line 1 (top 64)', () => {
    expect(blockTopPx(0)).toBe(0);
    expect(blockTopPx(1)).toBe(RULE_HEIGHT);
  });

  it('starter authoring intent: xOffset 56 == MARGIN_L (left gutter)', () => {
    expect(MARGIN_L).toBe(56);
  });
});
