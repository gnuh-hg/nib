import { describe, it, expect } from 'vitest';
import {
  toggleMode,
  navSelect,
  backToNav,
  DEFAULT_LEVEL,
  togglePop,
  isFormatVisible,
  isEraserVisible,
  sizeTitleKey,
  parseMode,
  parseCollapsed,
  clampPos,
  parsePos,
  defaultPos,
  expandDirection,
  flyoutTop,
  DOCK_ANCHOR_SIZE,
  DOCK_EXPANDED_H,
} from './dockState';

describe('dockState — UnifiedDock state machine (PLAN dock-v2 §c/§f)', () => {
  it('toggleMode cycles pen ↔ type', () => {
    expect(toggleMode('pen')).toBe('type');
    expect(toggleMode('type')).toBe('pen');
  });

  it('DEFAULT_LEVEL starts at NAV (S1.1 Q1 — not persisted)', () => {
    expect(DEFAULT_LEVEL).toBe('nav');
  });

  it('navSelect drills into TOOLS with the matching mode', () => {
    expect(navSelect('type')).toEqual({ mode: 'type', level: 'tools' });
    expect(navSelect('write')).toEqual({ mode: 'pen', level: 'tools' });
  });

  it('backToNav drills back up to NAV', () => {
    expect(backToNav()).toBe('nav');
  });

  it('togglePop opens a flyout, or closes it when already open', () => {
    expect(togglePop(null, 'ptr')).toBe('ptr'); // closed → open ptr
    expect(togglePop('ptr', 'ptr')).toBe(null); // open ptr → close
    expect(togglePop('ptr', 'sel')).toBe('sel'); // switch ptr → sel
  });

  it('format button is visible only in type mode', () => {
    expect(isFormatVisible('type')).toBe(true);
    expect(isFormatVisible('pen')).toBe(false);
  });

  it('stroke-eraser row is visible only in pen mode', () => {
    expect(isEraserVisible('pen')).toBe(true);
    expect(isEraserVisible('type')).toBe(false);
  });

  it('size flyout title key follows mode', () => {
    expect(sizeTitleKey('pen')).toBe('dock.size_stroke');
    expect(sizeTitleKey('type')).toBe('dock.size_font');
  });

  it('parseMode reads persisted value with safe fallback to pen', () => {
    expect(parseMode('type')).toBe('type');
    expect(parseMode('pen')).toBe('pen');
    expect(parseMode(null)).toBe('pen');
    expect(parseMode('garbage')).toBe('pen');
  });

  it('parseCollapsed reads only the literal "true"', () => {
    expect(parseCollapsed('true')).toBe(true);
    expect(parseCollapsed('false')).toBe(false);
    expect(parseCollapsed(null)).toBe(false);
  });
});

describe('dockState — drag positioning (PLAN dock-v2 Phase 3 §3.1)', () => {
  it('clampPos keeps the 56×56 anchor inside the viewport', () => {
    // within bounds → unchanged
    expect(clampPos(100, 50, 1280, 800)).toEqual({ x: 100, y: 50 });
    // overflow right/bottom → clamped to vw-56 / vh-56
    expect(clampPos(5000, 5000, 1280, 800)).toEqual({
      x: 1280 - DOCK_ANCHOR_SIZE,
      y: 800 - DOCK_ANCHOR_SIZE,
    });
    // negative → clamped to 0
    expect(clampPos(-30, -10, 1280, 800)).toEqual({ x: 0, y: 0 });
  });

  it('clampPos never returns negative bounds on tiny viewports', () => {
    expect(clampPos(100, 100, 40, 40)).toEqual({ x: 0, y: 0 });
  });

  it('defaultPos sits in the top-right corner (right:14 / top:14)', () => {
    expect(defaultPos(1280)).toEqual({ x: 1280 - DOCK_ANCHOR_SIZE - 14, y: 14 });
  });

  it('parsePos reads valid persisted JSON', () => {
    expect(parsePos('{"x":120,"y":240}', 1280)).toEqual({ x: 120, y: 240 });
  });

  it('parsePos falls back to default on null/garbage/partial/non-finite', () => {
    const def = defaultPos(1280);
    expect(parsePos(null, 1280)).toEqual(def);
    expect(parsePos('not json', 1280)).toEqual(def);
    expect(parsePos('{"x":1}', 1280)).toEqual(def);
    expect(parsePos('{"x":"a","y":2}', 1280)).toEqual(def);
    expect(parsePos('null', 1280)).toEqual(def);
  });
});

describe('dockState — overflow-aware expand/flyout (PLAN dock-v2 §3.2)', () => {
  it('expandDirection expands down when the shell fits below, up otherwise', () => {
    // plenty of room below → down
    expect(expandDirection(14, 1000)).toBe('down'); // 1000-14=986 >= 460
    // exactly enough → down
    expect(expandDirection(1000 - DOCK_EXPANDED_H, 1000)).toBe('down');
    // not enough room below → up
    expect(expandDirection(700, 1000)).toBe('up'); // 1000-700=300 < 460
  });

  it('flyoutTop opens downward at the button row when it fits', () => {
    // expTop=100, topRel=20, flyoutH=90, vh=1000 → 100+20+90=210 < 992 → topRel
    expect(flyoutTop(20, 100, 40, 90, 1000)).toBe(20);
  });

  it('flyoutTop flips up (ends at button bottom) when it would clip the bottom', () => {
    // near bottom: expTop=900, topRel=60, btnH=40, flyoutH=130, vh=1000
    // 900+60+130=1090 >= 992 → flip: 60 + 40 - 130 = -30 → clamp 0
    expect(flyoutTop(60, 900, 40, 130, 1000)).toBe(0);
    // flip that stays positive: expTop=900, topRel=200, btnH=40, flyoutH=90
    // 900+200+90=1190 >= 992 → 200 + 40 - 90 = 150
    expect(flyoutTop(200, 900, 40, 90, 1000)).toBe(150);
  });
});
