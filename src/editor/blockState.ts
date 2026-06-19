import type { BlockState } from '@/types/block';

/** Events that drive the block lifecycle (feature.md §5). */
export type BlockEvent =
  | 'focus-math'
  | 'focus-text'
  | 'capture-ink'
  | 'start-eval'
  | 'result-exact'
  | 'result-approx'
  | 'error'
  | 'edit-again'
  | 'empty-blur';

/**
 * Pure state transition. Unknown (state, event) pairs keep the current state
 * (defensive — never throws). Keeps the UI render purely a function of state.
 */
export function transition(state: BlockState, event: BlockEvent): BlockState {
  switch (event) {
    case 'focus-math':
      return 'editing-math';
    case 'focus-text':
      return 'editing-text';
    case 'capture-ink':
      return 'ink-capture';
    case 'start-eval':
      return 'evaluating';
    case 'result-exact':
      return 'result-exact';
    case 'result-approx':
      return 'result-approx';
    case 'error':
      return 'error';
    case 'edit-again':
      // Clicking a rendered result / error returns to editing (Typora-style).
      return 'editing-math';
    case 'empty-blur':
      return 'empty';
    default:
      return state;
  }
}

export function isResult(state: BlockState): boolean {
  return state === 'result-exact' || state === 'result-approx';
}
