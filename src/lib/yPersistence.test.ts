import { describe, it, expect } from 'vitest';
import { idbStoreName } from './yPersistence';

describe('idbStoreName — per-user IndexedDB namespacing (Phase D)', () => {
  it('guest / signed-out keeps the legacy store name (backward compatible)', () => {
    expect(idbStoreName('doc-1')).toBe('nib-ydoc-doc-1');
    expect(idbStoreName('doc-1', null)).toBe('nib-ydoc-doc-1');
    expect(idbStoreName('doc-1', '')).toBe('nib-ydoc-doc-1');
    expect(idbStoreName('doc-1', 'local')).toBe('nib-ydoc-doc-1');
  });

  it('signed-in users get an isolated, user-prefixed store', () => {
    expect(idbStoreName('doc-1', 'user-abc')).toBe('nib-ydoc-u-user-abc__doc-1');
    // Two users → different store names for the same document.
    expect(idbStoreName('doc-1', 'userA')).not.toBe(idbStoreName('doc-1', 'userB'));
  });

  it('sanitises reserved characters in the user id to a valid db name', () => {
    expect(idbStoreName('doc-1', 'a:b/c d')).toBe('nib-ydoc-u-a_b_c_d__doc-1');
  });
});
