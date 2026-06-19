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

/** Attributes persisted on every nibBlock node (free-placement model, feature.md §2). */
export interface NibBlockAttrs {
  id: string;
  /** Ruled-line index — top = lineIndex × 64px. */
  lineIndex: number;
  /** Authoring intent X in px from canvas left (NOT clamped render position). */
  xOffset: number;
  blockType: BlockType;
  blockState: BlockState;
  latexContent: string;
  exactLatex: string;
  approxLatex: string;
  isApprox: boolean;
  /** Error subtype when blockState === 'error'. */
  errorKind: ErrorKind;
  /** Text size tier when blockType === 'text'. */
  textScale: TextScale;
  /** Math display size when blockType === 'math'. */
  mathSize: MathSize;
  /** Accent/annotation color — a swatch token name (e.g. 'teal') or '' = default. */
  color: string;
  /** Whether this block was created by onboarding (starter content). */
  starter: boolean;
  /** Raw ink strokes (handwriting path) — stub in Phase 0 mock-UI. */
  inkStrokes: unknown[];
}

/** Default attrs for a freshly placed block. */
export function defaultBlockAttrs(
  overrides: Partial<NibBlockAttrs> = {},
): NibBlockAttrs {
  return {
    id: '',
    lineIndex: 0,
    xOffset: 0,
    blockType: 'math',
    blockState: 'editing-math',
    latexContent: '',
    exactLatex: '',
    approxLatex: '',
    isApprox: false,
    errorKind: '',
    textScale: 'body',
    mathSize: 'normal',
    color: '',
    starter: false,
    inkStrokes: [],
    ...overrides,
  };
}
