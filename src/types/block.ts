// Core block model types — shared by TipTap node spec, NodeView and services.

export type BlockType = 'math' | 'text' | 'ink';

/** Document-text size tier (feature.md §7.5.2). Block-level for the mock. */
export type TextScale = 'heading' | 'body' | 'small';

/** Math display size (feature.md §7.5). */
export type MathSize = 'normal' | 'display';

/** Error subtype surfaced in the ERROR state (design.md §5.2). */
export type ErrorKind = '' | 'empty_input' | 'parse' | 'timeout' | 'no_closed_form';

/**
 * Block lifecycle states (feature.md §5). Session 1.2 uses the editing/ink/empty
 * subset; EVALUATING / RESULT-* / ERROR arrive with the CAS pipeline (Session 1.3).
 */
export type BlockState =
  | 'empty'
  | 'editing-math'
  | 'editing-text'
  | 'ink-capture'
  | 'evaluating'
  | 'result-exact'
  | 'result-approx'
  | 'error';

/**
 * Structural attributes persisted on the nibBlock ProseMirror node.
 * Since Phase B (CC-1), layout/CAS fields live in the Yjs `blockMeta`
 * side-channel (see `BlockMetaRecord`) — NOT here — because y-prosemirror does
 * not sync node attrs reliably. Only these three stay on the PM node.
 */
export interface NibBlockAttrs {
  id: string;
  blockType: BlockType;
  /** Whether this block was created by onboarding (starter content). */
  starter: boolean;
}

/**
 * Block layout + CAS fields stored in the Yjs `blockMeta` side-channel
 * (CC-1, ARCHITECTURE §B) — keyed by block id, kept OUT of ProseMirror node
 * attrs because y-prosemirror does not sync attrs reliably. Structural attrs
 * (`id`/`blockType`/`starter`) stay on the PM node; everything below is CRDT
 * per-field (LWW). Wired into NibBlockView in Session B.3.
 */
export interface BlockMetaRecord {
  /** Authoring intent X in px from canvas left (NOT clamped render position). */
  xOffset: number;
  /** Ruled-line index — top = lineIndex × 64px. */
  lineIndex: number;
  blockState: BlockState;
  latexContent: string;
  exactLatex: string;
  approxLatex: string;
  isApprox: boolean;
  errorKind: ErrorKind;
  textScale: TextScale;
  mathSize: MathSize;
  /** Accent/annotation color — a swatch token name or '' = default. */
  color: string;
  /** Ink strokes as a JSON string (LWW per R4; Y.Array is a future upgrade). */
  inkStrokes: string;
}

/** Default structural attrs for a freshly placed block. */
export function defaultBlockAttrs(
  overrides: Partial<NibBlockAttrs> = {},
): NibBlockAttrs {
  return {
    id: '',
    blockType: 'math',
    starter: false,
    ...overrides,
  };
}
