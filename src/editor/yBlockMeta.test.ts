// Real-Y.Doc tests for the blockMeta side-channel (Phase B free-caret rebuild).
// No mocks — exercises actual Yjs CRDT semantics (per-field merge, idempotent
// init) that the editor relies on for cross-device sync.
//
// Phase B change: xOffset + lineIndex removed from BlockMetaRecord.
// Tests updated to use CAS fields (latexContent, color, etc.) instead.

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
    patchBlockMeta(doc, 'b1', { latexContent: 'x^2', color: 'teal', isApprox: true });

    const meta = getBlockMeta(doc, 'b1');
    expect(meta.latexContent).toBe('x^2');
    expect(meta.color).toBe('teal');
    expect(meta.isApprox).toBe(true);
    // Unwritten fields fall back to defaults.
    expect(meta.exactLatex).toBe('');
    expect(meta.blockState).toBe(DEFAULT_META.blockState);
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
    patchBlockMeta(docA, 'b1', { latexContent: 'x^2' });
    patchBlockMeta(docB, 'b1', { color: 'blue' });

    // Exchange updates both ways.
    Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA));
    Y.applyUpdate(docA, Y.encodeStateAsUpdate(docB));

    for (const doc of [docA, docB]) {
      const meta = getBlockMeta(doc, 'b1');
      expect(meta.latexContent).toBe('x^2');
      expect(meta.color).toBe('blue');
    }
  });

  it('initBlockMeta is idempotent — a second call never resets existing values', () => {
    const doc = new Y.Doc();
    initBlockMeta(doc, 'b1', { latexContent: 'x+1' });
    patchBlockMeta(doc, 'b1', { latexContent: '2x', color: 'teal' });

    // Calling init again must NOT clobber the live values.
    initBlockMeta(doc, 'b1', { latexContent: '', color: '' });

    const meta = getBlockMeta(doc, 'b1');
    expect(meta.latexContent).toBe('2x');
    expect(meta.color).toBe('teal');
  });

  it('deleteBlockMeta removes the entry (falls back to defaults afterwards)', () => {
    const doc = new Y.Doc();
    patchBlockMeta(doc, 'b1', { latexContent: 'x^2', blockState: 'result-exact' });
    expect(getBlockMeta(doc, 'b1').latexContent).toBe('x^2');

    deleteBlockMeta(doc, 'b1');
    expect(getBlockMeta(doc, 'b1')).toEqual(DEFAULT_META);
  });

  it('DEFAULT_META has no xOffset or lineIndex fields (Phase B cleanup)', () => {
    // Cast to unknown first to avoid TS narrowing complaint.
    const meta = DEFAULT_META as unknown as Record<string, unknown>;
    expect(meta['xOffset']).toBeUndefined();
    expect(meta['lineIndex']).toBeUndefined();
  });
});
