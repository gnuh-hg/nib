import type { CASResponse } from '@/services/mockCAS';
import type { BlockState, ErrorKind } from '@/types/block';

export interface EvalAttrs {
  blockState: BlockState;
  exactLatex?: string;
  approxLatex?: string;
  isApprox?: boolean;
  errorKind?: ErrorKind;
}

/**
 * Pure mapping CAS response → block attrs to apply (state machine, feature.md §5).
 * Extracted so the eval flow is testable without a live NodeView.
 */
export function resultToAttrs(res: CASResponse): EvalAttrs {
  if (res.error) {
    return { blockState: 'error', errorKind: res.error };
  }
  if (res.is_approx) {
    return {
      blockState: 'result-approx',
      exactLatex: res.exact_latex ?? '',
      approxLatex: res.approx_latex ?? '',
      isApprox: true,
    };
  }
  return {
    blockState: 'result-exact',
    exactLatex: res.exact_latex ?? '',
    approxLatex: res.approx_latex ?? '',
    isApprox: false,
  };
}
