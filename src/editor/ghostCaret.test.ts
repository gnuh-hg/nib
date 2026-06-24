/**
 * ghostCaret tests — Phase C.2 materialize-on-click.
 *
 * Tests:
 *  1. classifyClick pure helper — all virtual/content cases (unchanged).
 *  2. handleClickOnPaper — virtual path: row inserted + selection INSIDE row
 *     (valid inline pos, no "TextSelection endpoint not pointing into inline content").
 *  3. handleClickOnPaper — content path: selection set to posAtClick, no new row.
 *  4. handleClickOnPaper — empty doc short-circuit: row inserted without
 *     calling coordsAtPos.
 *  5. insertRowAtLine — direct: correct blankBefore, indent, doc-order, successor
 *     blankBefore adjustment.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import * as Y from 'yjs';
import { Editor } from '@tiptap/react';

import {
  classifyClick,
  handleClickOnPaper,
  insertRowAtLine,
} from '@/editor/plugins/ghostCaret';
import { RULE_HEIGHT } from '@/editor/geometry';
import { getRowMeta, patchRowMeta } from '@/lib/yRowMeta';
import { getRowMetaMap } from '@/lib/yjs';
import { NibDocument } from '@/editor/extensions/NibDocument';
import { NibText } from '@/editor/extensions/NibText';
import { Row } from '@/editor/extensions/Row';
import { MathInline } from '@/editor/extensions/MathInline';
import { MetaSyncPlugin } from '@/editor/extensions/MetaSyncPlugin';

// ── Helpers ───────────────────────────────────────────────────────────────────

let editor: Editor | null = null;

function makeEditor(ydoc: Y.Doc, content?: object) {
  editor = new Editor({
    extensions: [
      NibDocument,
      NibText,
      Row,
      MathInline,
      MetaSyncPlugin.configure({ ydoc }),
    ],
    content: content ?? { type: 'doc', content: [] },
  });
  return editor;
}

const PAPER_RECT = { top: 0, left: 0 } as DOMRect;

afterEach(() => {
  editor?.destroy();
  editor = null;
  vi.restoreAllMocks();
});

// ── classifyClick — pure helper ───────────────────────────────────────────────

describe('classifyClick — pure helper with rect mock', () => {
  const RECT = { top: 100, right: 200, bottom: 132 };

  it('content-hit: click inside rect bounds → content', () => {
    expect(classifyClick(150, 116, RECT, false)).toBe('content');
  });

  it('content-hit: click at end-of-row but within rect → content', () => {
    expect(classifyClick(200, 116, RECT, true)).toBe('content');
  });

  it('vertical-miss ABOVE → virtual', () => {
    expect(classifyClick(150, 60, RECT, false)).toBe('virtual');
  });

  it('vertical-miss BELOW → virtual', () => {
    expect(classifyClick(150, 170, RECT, false)).toBe('virtual');
  });

  it('vertical BOUNDARY just inside tolerance → content', () => {
    expect(classifyClick(150, RECT.top - RULE_HEIGHT / 2, RECT, false)).toBe('content');
    expect(classifyClick(150, RECT.bottom + RULE_HEIGHT / 2, RECT, false)).toBe('content');
  });

  it('horizontal-miss: past rect.right + threshold when isAtEndOfRow → virtual', () => {
    expect(classifyClick(210, 116, RECT, true)).toBe('virtual');
  });

  it('horizontal-miss NOT triggered when isAtEndOfRow=false', () => {
    expect(classifyClick(210, 116, RECT, false)).toBe('content');
  });

  it('horizontal boundary exactly at rect.right+threshold → content (not strictly greater)', () => {
    expect(classifyClick(206, 116, RECT, true)).toBe('content');
  });

  it('custom ruleHeight respected', () => {
    expect(
      classifyClick(150, 80, { top: 100, right: 200, bottom: 110 }, false, { ruleHeight: 32 }),
    ).toBe('virtual');
  });

  it('custom horizontalThreshold respected', () => {
    expect(classifyClick(201, 116, RECT, true, { horizontalThreshold: 0 })).toBe('virtual');
    expect(classifyClick(210, 116, RECT, true, { horizontalThreshold: 20 })).toBe('content');
  });
});

// ── insertRowAtLine — direct tests ────────────────────────────────────────────

describe('insertRowAtLine — direct', () => {
  it('empty doc → 1 row inserted, blankBefore=targetLine, indent=targetCol', () => {
    const ydoc = new Y.Doc();
    const e = makeEditor(ydoc);

    let createdId: string | null = null;
    insertRowAtLine(e, ydoc, e.view, 5, 56, (id) => { createdId = id; });

    expect(e.state.doc.childCount).toBe(1);
    expect(createdId).not.toBeNull();
    const rowId = e.state.doc.child(0).attrs.id as string;
    expect(rowId).toBe(createdId);
    const meta = getRowMeta(ydoc, rowId);
    expect(meta.blankBefore).toBe(5);
    expect(meta.indent).toBe(56);
  });

  it('empty doc → selection is INSIDE the new row (valid inline pos)', () => {
    const ydoc = new Y.Doc();
    const e = makeEditor(ydoc);

    insertRowAtLine(e, ydoc, e.view, 3, 100, () => {});

    // Selection anchor must be inside the row (pos 1 = first content pos of first row).
    // It should NOT be at pos 0 (doc boundary) which would cause the TextSelection error.
    const { anchor } = e.state.selection;
    expect(anchor).toBeGreaterThanOrEqual(1);
    // The selection head should be inside row content (not past the row close token).
    expect(anchor).toBeLessThanOrEqual(e.state.doc.child(0).nodeSize - 1);
  });

  it('virtual space invariant: 1 row only — no literal empty rows for blank lines', () => {
    const ydoc = new Y.Doc();
    const e = makeEditor(ydoc);

    insertRowAtLine(e, ydoc, e.view, 10, 0, () => {});

    expect(e.state.doc.childCount).toBe(1);
    expect(getRowMetaMap(ydoc).size).toBe(1);
    const rowId = e.state.doc.child(0).attrs.id as string;
    expect(getRowMeta(ydoc, rowId).blankBefore).toBe(10);
  });

  it('existing row BELOW targetLine → append, correct blankBefore', () => {
    const ydoc = new Y.Doc();
    const e = makeEditor(ydoc, {
      type: 'doc',
      content: [{ type: 'row', attrs: { id: 'r1' } }],
    });
    patchRowMeta(ydoc, 'r1', { blankBefore: 2, indent: 0 }); // r1 at absLine 2

    insertRowAtLine(e, ydoc, e.view, 5, 40, () => {});

    expect(e.state.doc.childCount).toBe(2);
    const newRowId = e.state.doc.child(1).attrs.id as string;
    expect(getRowMeta(ydoc, newRowId).blankBefore).toBe(2); // 5-(2+1)=2
    expect(getRowMeta(ydoc, newRowId).indent).toBe(40);
  });

  it('existing row ABOVE targetLine (absLine > targetLine) → insert BEFORE, adjust successor', () => {
    const ydoc = new Y.Doc();
    const e = makeEditor(ydoc, {
      type: 'doc',
      content: [{ type: 'row', attrs: { id: 'r1' } }],
    });
    patchRowMeta(ydoc, 'r1', { blankBefore: 5, indent: 0 }); // r1 at absLine 5

    insertRowAtLine(e, ydoc, e.view, 2, 40, () => {});

    expect(e.state.doc.childCount).toBe(2);
    const newRowId = e.state.doc.child(0).attrs.id as string;
    expect(getRowMeta(ydoc, newRowId).blankBefore).toBe(2);
    expect(getRowMeta(ydoc, 'r1').blankBefore).toBe(2); // 5-2-1=2; r1 stays at line 5
  });

  it('insert at line 0 before existing row → new row blankBefore=0, successor adjusted', () => {
    const ydoc = new Y.Doc();
    const e = makeEditor(ydoc, {
      type: 'doc',
      content: [{ type: 'row', attrs: { id: 'r1' } }],
    });
    patchRowMeta(ydoc, 'r1', { blankBefore: 3, indent: 0 }); // r1 at absLine 3

    insertRowAtLine(e, ydoc, e.view, 0, 56, () => {});

    expect(getRowMeta(ydoc, e.state.doc.child(0).attrs.id as string).blankBefore).toBe(0);
    expect(getRowMeta(ydoc, 'r1').blankBefore).toBe(2); // 3-0-1=2
  });
});

// ── handleClickOnPaper — virtual path (materialize-on-click) ─────────────────

describe('handleClickOnPaper — virtual path (materialize-on-click)', () => {
  it('virtual click (vertical miss) → row inserted + onEmptyRowCreated called', () => {
    const ydoc = new Y.Doc();
    const e = makeEditor(ydoc, {
      type: 'doc',
      content: [{ type: 'row', attrs: { id: 'r1' }, content: [{ type: 'text', text: 'hello' }] }],
    });

    vi.spyOn(e.view, 'posAtCoords').mockReturnValue({ pos: 2, inside: 0 });
    // Content at y=[10..42]; click at y=300 → vertical miss
    vi.spyOn(e.view, 'coordsAtPos').mockReturnValue({ top: 10, left: 56, right: 120, bottom: 42 } as DOMRect);

    let createdId: string | null = null;
    handleClickOnPaper(e.view, e, ydoc, 80, 300, PAPER_RECT, (id) => { createdId = id; });

    expect(e.state.doc.childCount).toBe(2);
    expect(createdId).not.toBeNull();
    // targetLine = floor(300/64) = 4.
    // r1 has blankBefore=0 (MetaSyncPlugin DEFAULT) → absLine=0.
    // New row appended after r1: blankBefore = 4 - (0+1) = 3.
    expect(getRowMeta(ydoc, createdId!).blankBefore).toBe(3);
  });

  it('virtual click: selection is inside the new row (no TextSelection endpoint error)', () => {
    const ydoc = new Y.Doc();
    const e = makeEditor(ydoc);
    vi.spyOn(e.view, 'posAtCoords').mockReturnValue(null);

    handleClickOnPaper(e.view, e, ydoc, 100, 200, PAPER_RECT, () => {});

    const { anchor } = e.state.selection;
    expect(anchor).toBeGreaterThanOrEqual(1);
  });
});

// ── handleClickOnPaper — empty doc short-circuit ──────────────────────────────

describe('handleClickOnPaper — empty doc (content.size === 0)', () => {
  it('empty doc → row created WITHOUT calling coordsAtPos', () => {
    const ydoc = new Y.Doc();
    const e = makeEditor(ydoc);

    const coordsSpy = vi.spyOn(e.view, 'coordsAtPos');
    vi.spyOn(e.view, 'posAtCoords').mockReturnValue({ pos: 0, inside: -1 });

    let createdId: string | null = null;
    handleClickOnPaper(e.view, e, ydoc, 100, 200, PAPER_RECT, (id) => { createdId = id; });

    expect(e.state.doc.childCount).toBe(1);
    expect(createdId).not.toBeNull();
    expect(coordsSpy).not.toHaveBeenCalled();
    // targetLine = floor(200/64) = 3
    expect(getRowMeta(ydoc, createdId!).blankBefore).toBe(3);
  });

  it('empty doc + click at line 0 → blankBefore=0', () => {
    const ydoc = new Y.Doc();
    const e = makeEditor(ydoc);
    vi.spyOn(e.view, 'posAtCoords').mockReturnValue(null);

    let createdId: string | null = null;
    handleClickOnPaper(e.view, e, ydoc, 56, 10, PAPER_RECT, (id) => { createdId = id; });

    expect(e.state.doc.childCount).toBe(1);
    expect(getRowMeta(ydoc, createdId!).blankBefore).toBe(0);
  });
});

// ── handleClickOnPaper — content path ────────────────────────────────────────

describe('handleClickOnPaper — content path (click on existing text)', () => {
  it('content click → selection at posAtClick, no new row', () => {
    const ydoc = new Y.Doc();
    const e = makeEditor(ydoc, {
      type: 'doc',
      content: [{ type: 'row', attrs: { id: 'r1' }, content: [{ type: 'text', text: 'abc' }] }],
    });

    vi.spyOn(e.view, 'posAtCoords').mockReturnValue({ pos: 2, inside: 0 });
    // rect contains clickY=100 → content hit
    vi.spyOn(e.view, 'coordsAtPos').mockReturnValue({ top: 90, left: 85, right: 115, bottom: 110 } as DOMRect);

    let createdId: string | null = null;
    handleClickOnPaper(e.view, e, ydoc, 100, 100, PAPER_RECT, (id) => { createdId = id; });

    expect(e.state.doc.childCount).toBe(1); // no new row
    expect(createdId).toBeNull();           // onEmptyRowCreated NOT called
    expect(e.state.selection.anchor).toBe(2);
  });

  it('content click: onEmptyRowCreated NOT called', () => {
    const ydoc = new Y.Doc();
    const e = makeEditor(ydoc, {
      type: 'doc',
      content: [{ type: 'row', attrs: { id: 'r1' }, content: [{ type: 'text', text: 'hi' }] }],
    });

    vi.spyOn(e.view, 'posAtCoords').mockReturnValue({ pos: 3, inside: 0 });
    vi.spyOn(e.view, 'coordsAtPos').mockReturnValue({ top: 100, left: 65, right: 80, bottom: 132 } as DOMRect);

    let called = false;
    handleClickOnPaper(e.view, e, ydoc, 70, 116, PAPER_RECT, () => { called = true; });

    expect(called).toBe(false);
  });
});

// ── Integration: PM selection sanity ─────────────────────────────────────────

describe('PM selection inside row (jsdom sanity)', () => {
  it('insertRowAtLine into empty doc leaves a valid selection', () => {
    const ydoc = new Y.Doc();
    const e = makeEditor(ydoc);

    insertRowAtLine(e, ydoc, e.view, 0, 0, () => {});

    // Selection must be resolvable (not at a doc-level boundary that throws).
    expect(() => e.state.doc.resolve(e.state.selection.anchor)).not.toThrow();
  });
});
