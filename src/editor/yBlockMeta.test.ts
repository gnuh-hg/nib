// Real-Y.Doc tests for the blockMeta side-channel (Phase B, Session B.2).
// No mocks — exercises actual Yjs CRDT semantics (per-field merge, idempotent
// init) that the editor relies on for cross-device sync.

import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';
import {
  getBlockMeta,
  patchBlockMeta,
  initBlockMeta,
  deleteBlockMeta,
  DEFAULT_META,
} from './yBlockMeta';

describe('yBlockMeta — Yjs blockMeta bridge', () => {
  it('patchBlockMeta → getBlockMeta returns the written values (and defaults elsewhere)', () => {
    const doc = new Y.Doc();
    patchBlockMeta(doc, 'b1', { xOffset: 120, latexContent: 'x^2', isApprox: true });

    const meta = getBlockMeta(doc, 'b1');
    expect(meta.xOffset).toBe(120);
    expect(meta.latexContent).toBe('x^2');
    expect(meta.isApprox).toBe(true);
    // Unwritten fields fall back to defaults.
    expect(meta.lineIndex).toBe(DEFAULT_META.lineIndex);
    expect(meta.exactLatex).toBe('');
  });

  it('returns DEFAULT_META for an unknown block (R3 race tolerance)', () => {
    const doc = new Y.Doc();
    expect(getBlockMeta(doc, 'missing')).toEqual(DEFAULT_META);
  });

  it('merges concurrent patches to different fields without data loss (CRDT)', () => {
    const docA = new Y.Doc();
    const docB = new Y.Doc();

    // Both start from the same initialised block.
    initBlockMeta(docA, 'b1');
    Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA));

    // Concurrent edits on different fields, made offline relative to each other.
    patchBlockMeta(docA, 'b1', { xOffset: 100 });
    patchBlockMeta(docB, 'b1', { latexContent: 'a+b' });

    // Exchange updates both ways.
    Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA));
    Y.applyUpdate(docA, Y.encodeStateAsUpdate(docB));

    for (const doc of [docA, docB]) {
      const meta = getBlockMeta(doc, 'b1');
      expect(meta.xOffset).toBe(100);
      expect(meta.latexContent).toBe('a+b');
    }
  });

  it('initBlockMeta is idempotent — a second call never resets existing values', () => {
    const doc = new Y.Doc();
    initBlockMeta(doc, 'b1', { xOffset: 50 });
    patchBlockMeta(doc, 'b1', { xOffset: 999, latexContent: 'kept' });

    // Calling init again must NOT clobber the live values.
    initBlockMeta(doc, 'b1', { xOffset: 0, latexContent: '' });

    const meta = getBlockMeta(doc, 'b1');
    expect(meta.xOffset).toBe(999);
    expect(meta.latexContent).toBe('kept');
  });

  it('deleteBlockMeta removes the entry (falls back to defaults afterwards)', () => {
    const doc = new Y.Doc();
    patchBlockMeta(doc, 'b1', { xOffset: 77 });
    expect(getBlockMeta(doc, 'b1').xOffset).toBe(77);

    deleteBlockMeta(doc, 'b1');
    expect(getBlockMeta(doc, 'b1')).toEqual(DEFAULT_META);
  });
});
