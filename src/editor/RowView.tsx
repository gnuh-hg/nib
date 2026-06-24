/**
 * RowView — TipTap React NodeView for the `row` node (Phase C.1).
 *
 * Reads rowMeta { blankBefore, indent } from the Yjs side-channel (useRowMeta)
 * and maps to CSS positioning on the ruled paper:
 *
 *   blankBefore × RULE_HEIGHT  → margin-top   (virtual blank lines above)
 *   indent (px)                → padding-left  (horizontal offset from row edge)
 *
 * Uses RULE_HEIGHT + MARGIN_L from geometry.ts — no hardcoded 64 or 56.
 *
 * Phase D will add: ghost-caret Decoration.widget, MathLive focus handoff.
 */

import type { CSSProperties } from 'react';
import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react';
import { useEditorContext } from '@/editor/editor-context';
import { useRowMeta } from '@/hooks/useRowMeta';
import { RULE_HEIGHT, MARGIN_L } from '@/editor/geometry';
import './row-view.css';

// ── Pure style helper (exported for unit tests) ──────────────────────────────

/**
 * Compute the inline style for a row from its layout meta.
 *
 * @param blankBefore - Number of blank ruled-lines above this row (rowMeta.blankBefore).
 *                      Each blank line = RULE_HEIGHT px of margin-top.
 * @param indent      - Horizontal content offset in px (rowMeta.indent).
 *                      0 = left edge of the row; MARGIN_L (56) = at the paper gutter.
 *
 * Both use named constants from geometry.ts — 64 and 56 are never hardcoded here.
 */
export function rowStyle(blankBefore: number, indent: number): CSSProperties {
  return {
    marginTop: blankBefore * RULE_HEIGHT,
    // indent is absolute from the row's left edge.
    // MARGIN_L (paper gutter) is the conventional default placement; indent=MARGIN_L
    // is the most common value for starter/placed rows.
    paddingLeft: indent,
    // Expose gutter constant as a CSS custom property for row-view.css / future decoration.
    '--row-gutter': `${MARGIN_L}px`,
  } as CSSProperties;
}

// ── RowView component ─────────────────────────────────────────────────────────

/**
 * React NodeView for the `row` PM node.
 *
 * - `dom` = NodeViewWrapper div.nib-row (carries margin + padding from rowMeta)
 * - `contentDOM` = NodeViewContent span.nib-row__content (PM injects text+atoms here)
 *
 * useRowMeta subscribes to the Yjs `rowMeta` Y.Map — the component re-renders live
 * when blankBefore or indent changes from any device (real-time positioning).
 */
export function RowView({ node }: NodeViewProps) {
  const { ydoc } = useEditorContext();
  const rowId = node.attrs.id as string;
  const { blankBefore, indent } = useRowMeta(ydoc, rowId);

  return (
    <NodeViewWrapper
      as="div"
      className="nib-row"
      style={rowStyle(blankBefore, indent)}
      data-row-id={rowId}
    >
      <NodeViewContent as="span" className="nib-row__content" />
    </NodeViewWrapper>
  );
}
