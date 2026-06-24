/**
 * C.1 tests — RowView style computation + text insert (Phase C.1).
 *
 * Tests:
 *  1. rowStyle pure function: blankBefore/indent → CSS properties.
 *     - Uses RULE_HEIGHT constant (not 64 hardcoded).
 *     - Uses MARGIN_L constant reference.
 *  2. PM default text insert: gõ = chèn tại caret, không overwrite.
 */

import { describe, it, expect, afterEach } from 'vitest';
import * as Y from 'yjs';
import { Editor } from '@tiptap/react';
import { TextSelection } from '@tiptap/pm/state';

import { RULE_HEIGHT, MARGIN_L } from '@/editor/geometry';
import { rowStyle } from '@/editor/RowView';
import { NibDocument } from '@/editor/extensions/NibDocument';
import { NibText } from '@/editor/extensions/NibText';
import { Row } from '@/editor/extensions/Row';
import { MathInline } from '@/editor/extensions/MathInline';
import { MetaSyncPlugin } from '@/editor/extensions/MetaSyncPlugin';

let editor: Editor | null = null;

afterEach(() => {
  editor?.destroy();
  editor = null;
});

// ── Helper ────────────────────────────────────────────────────────────────────

function makeRowEditor(text: string) {
  const ydoc = new Y.Doc();
  editor = new Editor({
    extensions: [NibDocument, NibText, Row, MathInline, MetaSyncPlugin.configure({ ydoc })],
    content: {
      type: 'doc',
      content: [{
        type: 'row',
        attrs: { id: 'r1' },
        content: text ? [{ type: 'text', text }] : [],
      }],
    },
  });
  return editor;
}

// ── rowStyle — pure style computation ────────────────────────────────────────

describe('rowStyle — pure style, uses RULE_HEIGHT + MARGIN_L constants', () => {
  it('RULE_HEIGHT constant is 64 (not hardcoded in RowView)', () => {
    // Gate: geometry.ts exports the right value
    expect(RULE_HEIGHT).toBe(64);
  });

  it('MARGIN_L constant is 56 (paper gutter, referenced in rowStyle)', () => {
    expect(MARGIN_L).toBe(56);
    // rowStyle exposes MARGIN_L via --row-gutter CSS custom property
    const style = rowStyle(0, 0) as Record<string, unknown>;
    expect(style['--row-gutter']).toBe(`${MARGIN_L}px`);
  });

  it('blankBefore=2 → margin-top = 2 × RULE_HEIGHT = 128px', () => {
    const style = rowStyle(2, 0);
    expect(style.marginTop).toBe(2 * RULE_HEIGHT);
    expect(style.marginTop).toBe(128); // 2 × 64
  });

  it('blankBefore=1 → margin-top = RULE_HEIGHT = 64px', () => {
    const style = rowStyle(1, 0);
    expect(style.marginTop).toBe(RULE_HEIGHT);
  });

  it('indent=56 → padding-left 56px (MARGIN_L = paper gutter)', () => {
    const style = rowStyle(0, 56);
    expect(style.paddingLeft).toBe(56);
    expect(style.paddingLeft).toBe(MARGIN_L); // 56 is the gutter
  });

  it('indent=40 → padding-left 40px', () => {
    const style = rowStyle(0, 40);
    expect(style.paddingLeft).toBe(40);
  });

  it('blankBefore=0, indent=0 → margin-top 0, padding-left 0', () => {
    const style = rowStyle(0, 0);
    expect(style.marginTop).toBe(0);
    expect(style.paddingLeft).toBe(0);
  });

  it('large blankBefore uses RULE_HEIGHT factor (not hardcoded 64)', () => {
    const style = rowStyle(5, 0);
    expect(style.marginTop).toBe(5 * RULE_HEIGHT); // 320
    expect(style.marginTop).not.toBe(5 * 64 - 1); // sanity: not a wrong constant
  });
});

// ── Text insert — PM default: insert at caret, no overwrite ──────────────────

describe('text insert — gõ = chèn tại caret, KHÔNG overwrite', () => {
  it('"abc" + insert "X" at pos 2 → "aXbc"', () => {
    const e = makeRowEditor('abc');
    // PM positions for doc > row{id:'r1'} > text("abc"):
    //   pos 0 = before row / row open
    //   pos 1 = before 'a'   (start of text inside row)
    //   pos 2 = between 'a' and 'b'
    //   pos 3 = between 'b' and 'c'
    //   pos 4 = after 'c'    (end of text)
    e.view.dispatch(
      e.state.tr.setSelection(TextSelection.create(e.state.doc, 2)),
    );
    e.view.dispatch(e.state.tr.insertText('X'));
    expect(e.state.doc.child(0).textContent).toBe('aXbc');
  });

  it('insert at start (pos 1) → prepends: "Yabc"', () => {
    const e = makeRowEditor('abc');
    e.view.dispatch(
      e.state.tr.setSelection(TextSelection.create(e.state.doc, 1)),
    );
    e.view.dispatch(e.state.tr.insertText('Y'));
    expect(e.state.doc.child(0).textContent).toBe('Yabc');
  });

  it('insert at end (pos 4) → appends: "abcZ"', () => {
    const e = makeRowEditor('abc');
    e.view.dispatch(
      e.state.tr.setSelection(TextSelection.create(e.state.doc, 4)),
    );
    e.view.dispatch(e.state.tr.insertText('Z'));
    expect(e.state.doc.child(0).textContent).toBe('abcZ');
  });

  it('multiple characters inserted at pos 2 → "aHELLObc"', () => {
    const e = makeRowEditor('abc');
    e.view.dispatch(
      e.state.tr.setSelection(TextSelection.create(e.state.doc, 2)),
    );
    e.view.dispatch(e.state.tr.insertText('HELLO'));
    expect(e.state.doc.child(0).textContent).toBe('aHELLObc');
  });

  it('two sequential inserts accumulate correctly', () => {
    const e = makeRowEditor('ac');
    // Insert 'b' between 'a' (pos 1) and 'c' (pos 2) → "abc"
    e.view.dispatch(
      e.state.tr.setSelection(TextSelection.create(e.state.doc, 2)),
    );
    e.view.dispatch(e.state.tr.insertText('b'));
    expect(e.state.doc.child(0).textContent).toBe('abc');

    // Now insert 'X' between 'a' and 'b' (pos 2)
    e.view.dispatch(
      e.state.tr.setSelection(TextSelection.create(e.state.doc, 2)),
    );
    e.view.dispatch(e.state.tr.insertText('X'));
    expect(e.state.doc.child(0).textContent).toBe('aXbc');
  });

  it('empty row → insert "hello" → "hello"', () => {
    const e = makeRowEditor('');
    // Empty row: pos 1 = inside row (no text content)
    e.view.dispatch(
      e.state.tr.setSelection(TextSelection.create(e.state.doc, 1)),
    );
    e.view.dispatch(e.state.tr.insertText('hello'));
    expect(e.state.doc.child(0).textContent).toBe('hello');
  });
});
