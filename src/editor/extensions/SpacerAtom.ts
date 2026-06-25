import { Node, mergeAttributes } from '@tiptap/core';
import type { Node as PMNode } from '@tiptap/pm/model';
import type * as Y from 'yjs';

/**
 * SpacerAtom — the virtual-whitespace leaf of the free-caret-v2 document model
 * (Path B, ARCHITECTURE.md §A.1).
 *
 * A `spacer_atom` is an inline LEAF (atom, no content) carrying a single STATIC
 * attribute `{ id }`. Its rendered width is NOT a node attribute — it lives in a
 * Yjs side-channel `Y.Map<number>` ("nib-spacer-widths") keyed by the atom id.
 * Keeping width off the PM node sidesteps the y-prosemirror node-attr sync bug
 * (CC-1): the only thing y-prosemirror has to sync is the static id.
 *
 * The NodeView reads `widthMap.get(id)` to size its `<span>`, then `observe()`s
 * the map so a later width change (e.g. a remote materialize, or an undo) is
 * reflected. Width updates are guarded (`newW !== currentW`) and deferred to a
 * `requestAnimationFrame` (R2 / CC-6) to avoid a write loop. `destroy()` MUST
 * `unobserve` to avoid leaking observers across StrictMode remounts (E3).
 */

export interface SpacerAtomOptions {
  /**
   * Yjs side-channel mapping spacer-atom id → width (px). `null` = safe no-op
   * (the NodeView renders a 0-width span and skips observe), so the extension
   * stays mountable before <YjsProvider> wires the map.
   */
  spacerWidthMap: Y.Map<number> | null;
}

/** Minimal ProseMirror NodeView for a spacer atom. Exported for unit tests. */
export class SpacerNodeView {
  dom: HTMLSpanElement;
  private readonly id: string;
  private readonly widthMap: Y.Map<number> | null;
  private currentW: number;
  // Bound instance method kept as a field so observe/unobserve use the same ref.
  private readonly _observer: () => void;

  constructor(node: PMNode, widthMap: Y.Map<number> | null) {
    this.id = (node.attrs.id as string) ?? '';
    this.widthMap = widthMap;

    const span = document.createElement('span');
    span.className = 'nib-spacer';
    span.setAttribute('data-id', this.id);
    span.setAttribute('contenteditable', 'false');

    const initial = widthMap?.get(this.id) ?? 0;
    this.currentW = initial;
    span.style.width = `${initial}px`;
    this.dom = span;

    this._observer = () => {
      requestAnimationFrame(() => {
        const newW = this.widthMap?.get(this.id) ?? 0;
        if (newW !== this.currentW) {
          this.dom.style.width = `${newW}px`;
          this.currentW = newW;
        }
      });
    };
    widthMap?.observe(this._observer);
  }

  /** Leaf: never let DOM mutations bubble back into PM. */
  ignoreMutation(): boolean {
    return true;
  }

  /** E3: stop observing so a destroyed (remounted) view leaks no observer. */
  destroy(): void {
    this.widthMap?.unobserve(this._observer);
  }
}

export const SpacerAtom = Node.create<SpacerAtomOptions>({
  name: 'spacer_atom',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: false,

  addOptions() {
    return { spacerWidthMap: null };
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-id'),
        renderHTML: (attributes) =>
          attributes.id ? { 'data-id': attributes.id } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span.nib-spacer' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, { class: 'nib-spacer' }),
    ];
  },

  addNodeView() {
    const widthMap = this.options.spacerWidthMap;
    return ({ node }) => new SpacerNodeView(node, widthMap);
  },
});
