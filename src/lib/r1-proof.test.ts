/**
 * R1 PROOF TESTS (ARCHITECTURE.md §2 — Phase B.2)
 *
 * Proves the "virtual whitespace" invariant:
 *   - A fresh Y.Doc is tiny (< 1024 bytes) — NOT ~180KB.
 *   - Creating 1 content row = XmlFragment.length===1, rowMeta.size===1.
 *   - No spurious empty rows for virtual blank lines.
 *   - Orphan blockMeta survives delete + undo (lazy GC — undo-safe).
 */

import { describe, it, expect, afterEach } from 'vitest';
import * as Y from 'yjs';
import { Editor } from '@tiptap/react';

import {
  PROSEMIRROR_FRAGMENT,
  getRowMetaMap,
  getBlockMetaMap,
} from '@/lib/yjs';
import {
  initRowMeta,
  patchRowMeta,
  getRowMeta,
  DEFAULT_ROW_META,
} from '@/lib/yRowMeta';
import { getBlockMeta, patchBlockMeta } from '@/editor/yBlockMeta';
import { NibDocument } from '@/editor/extensions/NibDocument';
import { NibText } from '@/editor/extensions/NibText';
import { Row } from '@/editor/extensions/Row';
import { MathInline } from '@/editor/extensions/MathInline';
import { MetaSyncPlugin } from '@/editor/extensions/MetaSyncPlugin';

// ─── helpers ────────────────────────────────────────────────────────────────

let editor: Editor | null = null;

function makeEditorWithYjs(ydoc: Y.Doc, content?: object) {
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

afterEach(() => {
  editor?.destroy();
  editor = null;
});

// ─── R1 Proof: fresh Y.Doc ──────────────────────────────────────────────────

describe('R1 — fresh Y.Doc is tiny and empty', () => {
  it('XmlFragment.length === 0, rowMeta.size === 0, blockMeta.size === 0', () => {
    const ydoc = new Y.Doc();
    const frag = ydoc.getXmlFragment(PROSEMIRROR_FRAGMENT);
    const rowMetaMap = getRowMetaMap(ydoc);
    const blockMetaMap = getBlockMetaMap(ydoc);

    expect(frag.length).toBe(0);
    expect(rowMetaMap.size).toBe(0);
    expect(blockMetaMap.size).toBe(0);
  });

  it('Y.encodeStateAsUpdate(fresh ydoc).byteLength < 1024 (not ~180KB)', () => {
    const ydoc = new Y.Doc();
    // Accessing shared types does NOT write data → state stays tiny.
    ydoc.getXmlFragment(PROSEMIRROR_FRAGMENT);
    getRowMetaMap(ydoc);
    getBlockMetaMap(ydoc);

    const bytes = Y.encodeStateAsUpdate(ydoc).byteLength;
    // Typical: 1–10 bytes for an empty doc. Assert well under 1KB.
    expect(bytes).toBeLessThan(1024);
  });
});

// ─── R1 Proof: 1 row simulation ─────────────────────────────────────────────

describe('R1 — 1 row = XmlFragment.length===1, rowMeta.size===1, no spurious entries', () => {
  it('manually inserting 1 Y.XmlElement row → fragment.length===1', () => {
    const ydoc = new Y.Doc();
    const frag = ydoc.getXmlFragment(PROSEMIRROR_FRAGMENT);

    // Simulate what y-prosemirror does when inserting 1 row with text.
    const rowEl = new Y.XmlElement('row');
    rowEl.setAttribute('id', 'r1');
    const textEl = new Y.XmlText();
    textEl.insert(0, 'x');
    ydoc.transact(() => {
      rowEl.insert(0, [textEl]);
      frag.insert(0, [rowEl]);
    });

    // Exactly 1 element in fragment — no spurious empty rows from virtual space.
    expect(frag.length).toBe(1);
  });

  it('initRowMeta for 1 row → rowMeta.size===1, correct values', () => {
    const ydoc = new Y.Doc();
    initRowMeta(ydoc, 'r1', { blankBefore: 50, indent: 300 });

    const rowMetaMap = getRowMetaMap(ydoc);
    expect(rowMetaMap.size).toBe(1);

    const meta = getRowMeta(ydoc, 'r1');
    expect(meta.blankBefore).toBe(50);
    expect(meta.indent).toBe(300);
  });

  it('no row entries in rowMeta for virtual blank lines (only content rows persisted)', () => {
    const ydoc = new Y.Doc();
    // "click line 10, type x" → 1 rowMeta entry with blankBefore=10.
    // NOT 10 entries for each virtual blank line.
    initRowMeta(ydoc, 'content-row', { blankBefore: 10, indent: 0 });
    expect(getRowMetaMap(ydoc).size).toBe(1);
  });
});

// ─── MetaSyncPlugin: appendTransaction auto-init ────────────────────────────

describe('MetaSyncPlugin — appendTransaction auto-inits rowMeta + blockMeta', () => {
  it('inserting a row via PM dispatch triggers initRowMeta', () => {
    const ydoc = new Y.Doc();
    const e = makeEditorWithYjs(ydoc);

    const rowNode = e.schema.nodes.row?.create({ id: 'test-row' });
    expect(rowNode).toBeDefined();
    if (!rowNode) return;

    e.view.dispatch(e.state.tr.insert(0, rowNode));

    // appendTransaction fires synchronously in dispatch → initRowMeta called.
    const rowMetaMap = getRowMetaMap(ydoc);
    expect(rowMetaMap.has('test-row')).toBe(true);
    expect(getRowMeta(ydoc, 'test-row')).toEqual(DEFAULT_ROW_META);
  });

  it('inserting a mathInline atom via PM dispatch triggers initBlockMeta', () => {
    const ydoc = new Y.Doc();
    const e = makeEditorWithYjs(ydoc, {
      type: 'doc',
      content: [{ type: 'row', attrs: { id: 'r1' } }],
    });

    const atom = e.schema.nodes.mathInline?.create({ id: 'atom1' });
    expect(atom).toBeDefined();
    if (!atom) return;

    // Insert atom inside the row (pos 1 = inside row content).
    e.view.dispatch(e.state.tr.insert(1, atom));

    const blockMetaMap = getBlockMetaMap(ydoc);
    expect(blockMetaMap.has('atom1')).toBe(true);
  });
});

// ─── Orphan/undo test ────────────────────────────────────────────────────────

describe('orphan/undo — lazy GC preserves blockMeta through delete+undo', () => {
  it('delete mathInline → blockMeta NOT deleted (lazy GC, undo-safe)', () => {
    const ydoc = new Y.Doc();
    const e = makeEditorWithYjs(ydoc, {
      type: 'doc',
      content: [{
        type: 'row',
        attrs: { id: 'r1' },
        content: [{ type: 'mathInline', attrs: { id: 'atom1' } }],
      }],
    });

    // Simulate user evaluating the math → blockMeta has a result.
    patchBlockMeta(ydoc, 'atom1', {
      latexContent: 'x^2',
      blockState: 'result-exact',
      exactLatex: '2x',
      isApprox: false,
    });

    expect(getBlockMeta(ydoc, 'atom1').latexContent).toBe('x^2');
    expect(getBlockMeta(ydoc, 'atom1').blockState).toBe('result-exact');

    // Delete the mathInline from PM. (pos 1 = inside row; nodeSize=1 → range [1,2))
    e.view.dispatch(e.state.tr.delete(1, 2));

    // Verify atom is gone from PM doc.
    let found = false;
    e.state.doc.descendants((node) => {
      if (node.type.name === 'mathInline' && node.attrs.id === 'atom1') found = true;
      return true;
    });
    expect(found).toBe(false);

    // LAZY GC: blockMeta MUST still exist after deletion (undo-safe).
    const metaAfterDelete = getBlockMeta(ydoc, 'atom1');
    expect(metaAfterDelete.latexContent).toBe('x^2');
    expect(metaAfterDelete.blockState).toBe('result-exact');
    expect(metaAfterDelete.exactLatex).toBe('2x');
  });

  it('re-insert same id (simulate undo) → blockMeta entry still intact', () => {
    const ydoc = new Y.Doc();
    const e = makeEditorWithYjs(ydoc, {
      type: 'doc',
      content: [{ type: 'row', attrs: { id: 'r1' } }],
    });

    // Patch blockMeta for atom that will be inserted → deleted → re-inserted.
    patchBlockMeta(ydoc, 'atom1', { latexContent: 'y^3', exactLatex: '3y^2' });

    // Insert.
    const atom = e.schema.nodes.mathInline?.create({ id: 'atom1' });
    if (!atom) return;
    e.view.dispatch(e.state.tr.insert(1, atom));

    // Delete.
    e.view.dispatch(e.state.tr.delete(1, 2));
    expect(getBlockMeta(ydoc, 'atom1').latexContent).toBe('y^3'); // lazy GC → preserved

    // Simulate undo: re-insert with same id.
    const atom2 = e.schema.nodes.mathInline?.create({ id: 'atom1' });
    if (!atom2) return;
    e.view.dispatch(e.state.tr.insert(1, atom2));

    // blockMeta intact after re-insert (initBlockMeta idempotent → no overwrite).
    const metaAfterUndo = getBlockMeta(ydoc, 'atom1');
    expect(metaAfterUndo.latexContent).toBe('y^3');
    expect(metaAfterUndo.exactLatex).toBe('3y^2');
  });
});

// ─── yRowMeta bridge unit tests ──────────────────────────────────────────────

describe('yRowMeta bridge', () => {
  it('patchRowMeta → getRowMeta returns written values', () => {
    const ydoc = new Y.Doc();
    patchRowMeta(ydoc, 'r1', { blankBefore: 5, indent: 120 });
    const meta = getRowMeta(ydoc, 'r1');
    expect(meta.blankBefore).toBe(5);
    expect(meta.indent).toBe(120);
  });

  it('getRowMeta returns DEFAULT_ROW_META for missing entry (R3 tolerance)', () => {
    const ydoc = new Y.Doc();
    expect(getRowMeta(ydoc, 'missing')).toEqual(DEFAULT_ROW_META);
  });

  it('initRowMeta is idempotent — second call preserves existing values', () => {
    const ydoc = new Y.Doc();
    initRowMeta(ydoc, 'r1', { blankBefore: 3, indent: 200 });
    patchRowMeta(ydoc, 'r1', { blankBefore: 99 });
    // Second init must NOT overwrite the patched value.
    initRowMeta(ydoc, 'r1', { blankBefore: 0, indent: 0 });
    expect(getRowMeta(ydoc, 'r1').blankBefore).toBe(99);
  });

  it('CRDT: concurrent patches to blankBefore and indent both survive', () => {
    const docA = new Y.Doc();
    const docB = new Y.Doc();

    initRowMeta(docA, 'r1');
    Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA));

    // Concurrent edits on different fields.
    patchRowMeta(docA, 'r1', { blankBefore: 7 });
    patchRowMeta(docB, 'r1', { indent: 80 });

    // Exchange updates.
    Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA));
    Y.applyUpdate(docA, Y.encodeStateAsUpdate(docB));

    for (const doc of [docA, docB]) {
      const meta = getRowMeta(doc, 'r1');
      expect(meta.blankBefore).toBe(7);
      expect(meta.indent).toBe(80);
    }
  });
});
