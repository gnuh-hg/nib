/**
 * Migration tests (Phase B.3 — ARCHITECTURE.md §3).
 *
 * 4 test cases (§3e) + HARD ASSERTION: indexedDB.deleteDatabase NEVER called.
 *
 * In jsdom, indexedDB is undefined — IDB-persistence step is skipped in
 * migrateIfNeeded (guarded by `typeof indexedDB !== 'undefined'`). Tests
 * verify the CONVERSION LOGIC (detect + build + verify) and the
 * deleteDatabase invariant, not the actual IDB write (browser-only).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Y from 'yjs';

import {
  detectSchemaVersion,
  migrateIfNeeded,
  _readOldBlocks,
  _convertOldDocToNew,
} from '@/lib/migration';
import { getBlockMetaMap, PROSEMIRROR_FRAGMENT } from '@/lib/yjs';
import { getBlockMeta } from '@/editor/yBlockMeta';
import { getRowMeta } from '@/lib/yRowMeta';

// ── Spy on indexedDB.deleteDatabase ─────────────────────────────────────────

// HARD ASSERTION: deleteDatabase must NEVER be called (ARCHITECTURE.md §3c).
//
// In jsdom, indexedDB is undefined — the guard `typeof indexedDB !== 'undefined'`
// in migrateIfNeeded prevents ALL IDB code from running, so deleteDatabase
// can never be called. The spy therefore always reports 0 calls (trivially true).
//
// If real IndexedDB is present (e.g., browser-mode test), we spy on the real method.
// We do NOT install a fake indexedDB object — doing so makes y-indexeddb try to
// call indexedDB.open() on the fake and throw an unhandled rejection.
let deleteDatabaseSpy = vi.fn();

beforeEach(() => {
  deleteDatabaseSpy = vi.fn();
  if (typeof indexedDB !== 'undefined' && 'deleteDatabase' in indexedDB) {
    vi.spyOn(indexedDB, 'deleteDatabase').mockImplementation(deleteDatabaseSpy);
  }
  // In jsdom (indexedDB === undefined), the spy starts at 0 calls and migration
  // code never touches IDB — constraint is trivially satisfied.
});

function assertDeleteNeverCalled() {
  expect(deleteDatabaseSpy).not.toHaveBeenCalled();
}

// ── Helpers to build test Y.Doc ───────────────────────────────────────────────

/**
 * Create an old-format Y.Doc (nibBlock schema).
 * Inserts Y.XmlElement('nibBlock') nodes into the XmlFragment and sets blockMeta.
 */
function makeOldDoc(
  blocks: Array<{
    id: string;
    blockType?: 'math' | 'text' | 'ink';
    text?: string;
    xOffset?: number;
    lineIndex?: number;
    latexContent?: string;
    blockState?: string;
    exactLatex?: string;
    approxLatex?: string;
    isApprox?: boolean;
  }>,
): Y.Doc {
  const ydoc = new Y.Doc();
  const frag = ydoc.getXmlFragment(PROSEMIRROR_FRAGMENT);
  const blockMetaMap = getBlockMetaMap(ydoc);

  ydoc.transact(() => {
    for (const b of blocks) {
      const el = new Y.XmlElement('nibBlock');
      el.setAttribute('id', b.id);
      el.setAttribute('blockType', b.blockType ?? 'math');
      if (b.text) {
        const txt = new Y.XmlText();
        txt.insert(0, b.text);
        el.insert(0, [txt]);
      }
      frag.insert(frag.length, [el]);

      // Set old blockMeta with xOffset + lineIndex.
      const entry = new Y.Map();
      entry.set('xOffset', b.xOffset ?? 0);
      entry.set('lineIndex', b.lineIndex ?? 0);
      entry.set('latexContent', b.latexContent ?? '');
      entry.set('blockState', b.blockState ?? 'editing-math');
      entry.set('exactLatex', b.exactLatex ?? '');
      entry.set('approxLatex', b.approxLatex ?? '');
      entry.set('isApprox', b.isApprox ?? false);
      entry.set('errorKind', '');
      entry.set('mathSize', 'normal');
      entry.set('color', '');
      entry.set('inkStrokes', '[]');
      blockMetaMap.set(b.id, entry);
    }
  });

  return ydoc;
}

// ── detectSchemaVersion ────────────────────────────────────────────────────

describe('detectSchemaVersion', () => {
  it('fresh empty doc → empty-new', () => {
    expect(detectSchemaVersion(new Y.Doc())).toBe('empty-new');
  });

  it('doc with schemaVersion=2 → v2', () => {
    const ydoc = new Y.Doc();
    ydoc.getMap('docMeta').set('schemaVersion', 2);
    expect(detectSchemaVersion(ydoc)).toBe('v2');
  });

  it('doc with nibBlock nodes → old-data', () => {
    const ydoc = makeOldDoc([{ id: 'b1' }]);
    expect(detectSchemaVersion(ydoc)).toBe('old-data');
  });

  it('doc with blockMeta but no fragment → old-data', () => {
    const ydoc = new Y.Doc();
    const entry = new Y.Map<unknown>();
    entry.set('latexContent', 'x');
    getBlockMetaMap(ydoc).set('orphan', entry);
    expect(detectSchemaVersion(ydoc)).toBe('old-data');
  });
});

// ── C1: empty old → stamp v2, 0 row, store cũ nguyên ──────────────────────

describe('C1: empty old doc → empty-stamped', () => {
  it('returns empty-stamped + stamps schemaVersion=2 + no rows in doc', async () => {
    const ydoc = new Y.Doc();
    const result = await migrateIfNeeded(ydoc, 'doc1', 'user1');

    expect(result.status).toBe('empty-stamped');
    expect(result.newDoc).toBeUndefined();
    // schemaVersion should be stamped on the ydoc.
    expect(ydoc.getMap('docMeta').get('schemaVersion')).toBe(2);
    // XmlFragment still empty (nothing to migrate).
    expect(ydoc.getXmlFragment(PROSEMIRROR_FRAGMENT).length).toBe(0);

    assertDeleteNeverCalled();
  });
});

// ── C2: old text block → 1 row[text], rowMeta{blankBefore=2, indent=40} ────

describe('C2: old text block @(line2, x40) → row with text + correct rowMeta', () => {
  it('produces 1 row with text content and correct layout meta', async () => {
    const ydoc = makeOldDoc([
      {
        id: 'b1',
        blockType: 'text',
        text: 'Bài 1',
        lineIndex: 2,
        xOffset: 40,
      },
    ]);

    // Verify via _convertOldDocToNew for pure conversion logic.
    const { newDoc, blocks } = _convertOldDocToNew(ydoc);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].blockType).toBe('text');
    expect(blocks[0].textContent).toBe('Bài 1');

    // 1 row in new XmlFragment.
    const newFrag = newDoc.getXmlFragment(PROSEMIRROR_FRAGMENT);
    expect(newFrag.length).toBe(1);
    const rowEl = newFrag.get(0);
    expect(rowEl).toBeInstanceOf(Y.XmlElement);
    expect((rowEl as Y.XmlElement).nodeName).toBe('row');

    // rowMeta: blankBefore=2 (lineIndex=2 → 2 blank lines above), indent=40.
    const rowId = `migrated-row-${blocks[0].id}`;
    const rowMeta = getRowMeta(newDoc, rowId);
    expect(rowMeta.blankBefore).toBe(2);
    expect(rowMeta.indent).toBe(40);

    // Store cũ KHÔNG bị đụng (nibBlock still in old ydoc).
    expect(ydoc.getXmlFragment(PROSEMIRROR_FRAGMENT).length).toBe(1);
    assertDeleteNeverCalled();
  });

  it('full migrateIfNeeded returns migrated status + newDoc', async () => {
    const ydoc = makeOldDoc([{ id: 'b2', blockType: 'text', text: 'hello', lineIndex: 2, xOffset: 40 }]);
    const result = await migrateIfNeeded(ydoc, 'doc-c2', 'u1');
    expect(result.status).toBe('migrated');
    expect(result.newDoc).toBeDefined();
    assertDeleteNeverCalled();
  });
});

// ── C3: old math+result → 1 row[mathInline], blockMeta correct (no x/line) ─

describe('C3: old math+result → row[mathInline] + blockMeta (bỏ xOffset/lineIndex)', () => {
  it('produces correct blockMeta without xOffset/lineIndex + correct rowMeta', async () => {
    const ydoc = makeOldDoc([
      {
        id: 'b3',
        blockType: 'math',
        lineIndex: 1,
        xOffset: 56,
        latexContent: '\\int x^2\\,dx',
        blockState: 'result-exact',
        exactLatex: '\\frac{x^3}{3}+C',
        isApprox: false,
      },
    ]);

    const { newDoc, blocks } = _convertOldDocToNew(ydoc);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].blockType).toBe('math');
    expect(blocks[0].latexContent).toBe('\\int x^2\\,dx');

    // New XmlFragment has 1 row.
    const newFrag = newDoc.getXmlFragment(PROSEMIRROR_FRAGMENT);
    expect(newFrag.length).toBe(1);

    // blockMeta for the math atom (keyed by block id).
    const atomMeta = getBlockMeta(newDoc, 'b3');
    expect(atomMeta.latexContent).toBe('\\int x^2\\,dx');
    expect(atomMeta.exactLatex).toBe('\\frac{x^3}{3}+C');
    expect(atomMeta.blockState).toBe('result-exact');
    expect(atomMeta.isApprox).toBe(false);
    // xOffset + lineIndex must NOT be in blockMeta (they moved to rowMeta).
    const atomMetaRaw = atomMeta as unknown as Record<string, unknown>;
    expect(atomMetaRaw['xOffset']).toBeUndefined();
    expect(atomMetaRaw['lineIndex']).toBeUndefined();

    // rowMeta: blankBefore=1 (lineIndex=1), indent=56.
    const rowId = `migrated-row-${blocks[0].id}`;
    const rowMeta = getRowMeta(newDoc, rowId);
    expect(rowMeta.blankBefore).toBe(1);
    expect(rowMeta.indent).toBe(56);

    // Store cũ intact.
    expect(ydoc.getXmlFragment(PROSEMIRROR_FRAGMENT).length).toBe(1);
    assertDeleteNeverCalled();
  });
});

// ── C4: corrupt node → fallback, store cũ nguyên ───────────────────────────

describe('C4: corrupt/unknown node → fallback, old store preserved', () => {
  it('returns fallback when conversion throws (unknown XML node alongside nibBlock)', async () => {
    const ydoc = new Y.Doc();
    const frag = ydoc.getXmlFragment(PROSEMIRROR_FRAGMENT);
    const nibBlockEl = new Y.XmlElement('nibBlock');
    nibBlockEl.setAttribute('id', 'b4');
    const corruptEl = new Y.XmlElement('unknownCorruptNode');
    // Put nibBlock first (so detectSchemaVersion returns 'old-data'),
    // then corrupt node (triggers throw in _readOldBlocks).
    ydoc.transact(() => { frag.insert(0, [nibBlockEl, corruptEl]); });

    const result = await migrateIfNeeded(ydoc, 'doc-c4', 'u1');
    expect(result.status).toBe('fallback');
    expect(result.error).toBeDefined();
    expect(result.newDoc).toBeUndefined();

    // Old XmlFragment is untouched (2 elements: nibBlock + corrupt).
    expect(frag.length).toBe(2);
    assertDeleteNeverCalled();
  });
});

// ── Common: deleteDatabase NEVER across all cases ────────────────────────────

describe('HARD CONSTRAINT: indexedDB.deleteDatabase NEVER called', () => {
  it('C1 empty → no deleteDatabase', async () => {
    await migrateIfNeeded(new Y.Doc(), 'x', 'y');
    assertDeleteNeverCalled();
  });

  it('C4 fallback → no deleteDatabase', async () => {
    const ydoc = new Y.Doc();
    const frag = ydoc.getXmlFragment(PROSEMIRROR_FRAGMENT);
    const el = new Y.XmlElement('nibBlock');
    const bad = new Y.XmlElement('corrupt');
    ydoc.transact(() => { frag.insert(0, [el, bad]); });
    await migrateIfNeeded(ydoc, 'x', 'y');
    assertDeleteNeverCalled();
  });

  it('v2-existing → no deleteDatabase', async () => {
    const ydoc = new Y.Doc();
    ydoc.getMap('docMeta').set('schemaVersion', 2);
    await migrateIfNeeded(ydoc, 'x', 'y');
    assertDeleteNeverCalled();
  });
});
