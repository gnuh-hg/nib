import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as Y from 'yjs';
import type { Node as PMNode } from '@tiptap/pm/model';
import { SpacerAtom, SpacerNodeView } from './extensions/SpacerAtom';

/** Smallest stand-in for a PM spacer node — the NodeView only reads attrs.id. */
function makeNode(id: string): PMNode {
  return { attrs: { id } } as unknown as PMNode;
}

describe('SpacerAtom (Phase A — schema spacer-atom)', () => {
  beforeEach(() => {
    // Run requestAnimationFrame synchronously so the observer's deferred width
    // update is observable in the same tick.
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('registers the node under the name "spacer_atom"', () => {
    expect(SpacerAtom.name).toBe('spacer_atom');
  });

  it('NodeView renders <span class="nib-spacer"> carrying the id as data-id', () => {
    const map = new Y.Doc().getMap<number>('w');
    const view = new SpacerNodeView(makeNode('abc'), map);
    expect(view.dom.tagName).toBe('SPAN');
    expect(view.dom.className).toBe('nib-spacer');
    expect(view.dom.getAttribute('data-id')).toBe('abc');
  });

  it('reads the initial width from the Y.Map at construction', () => {
    const map = new Y.Doc().getMap<number>('w');
    map.set('abc', 42);
    const view = new SpacerNodeView(makeNode('abc'), map);
    expect(view.dom.style.width).toBe('42px');
  });

  it('updates width when the Y.Map value changes (observe → rAF, guard new!==old)', () => {
    const map = new Y.Doc().getMap<number>('w');
    const view = new SpacerNodeView(makeNode('abc'), map);
    expect(view.dom.style.width).toBe('0px');
    map.set('abc', 100);
    expect(view.dom.style.width).toBe('100px');
  });

  it('E3: destroy() unobserves — a later Y.Map change does NOT touch width', () => {
    const map = new Y.Doc().getMap<number>('w');
    const view = new SpacerNodeView(makeNode('abc'), map);
    view.destroy();
    map.set('abc', 200);
    expect(view.dom.style.width).toBe('0px'); // unchanged after unobserve
  });

  it('null widthMap is a safe no-op (0-width span, observe/destroy never throw)', () => {
    const view = new SpacerNodeView(makeNode('abc'), null);
    expect(view.dom.getAttribute('data-id')).toBe('abc');
    expect(view.dom.style.width).toBe('0px');
    expect(() => view.destroy()).not.toThrow();
  });

  it('ignoreMutation() is true so leaf DOM never bubbles back into PM', () => {
    const map = new Y.Doc().getMap<number>('w');
    const view = new SpacerNodeView(makeNode('abc'), map);
    expect(view.ignoreMutation()).toBe(true);
  });
});
