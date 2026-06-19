// Mock CAS — frontend stub standing in for the FastAPI+SymPy backend (Phase 0).
// Replaced by a real `POST /eval` in Phase 1. Keeps the exact/approx/is_approx/
// error output contract (feature.md §9) so the editor wiring is identical later.

export type CASErrorKind =
  | 'empty_input'
  | 'parse'
  | 'timeout'
  | 'no_closed_form';

export interface CASResponse {
  exact_latex: string | null;
  approx_latex: string | null;
  is_approx: boolean;
  error: CASErrorKind | null;
}

function exact(exactLatex: string, approxLatex: string | null = null): CASResponse {
  return {
    exact_latex: exactLatex,
    approx_latex: approxLatex,
    is_approx: false,
    error: null,
  };
}

function approxOnly(approxLatex: string): CASResponse {
  return {
    exact_latex: null,
    approx_latex: approxLatex,
    is_approx: true,
    error: null,
  };
}

function err(kind: CASErrorKind): CASResponse {
  return { exact_latex: null, approx_latex: null, is_approx: false, error: kind };
}

/** Canned results keyed by exact LaTeX (≥10 fixtures, design/plan §1.3). */
export const CANNED: Record<string, CASResponse> = {
  '\\frac{d}{dx}x^2': exact('2x'),
  '\\int x\\,dx': exact('\\frac{x^2}{2}+C'),
  '\\frac{2}{3}+\\frac{1}{4}': exact('\\frac{11}{12}', '0.9167'),
  '\\sqrt{8}': exact('2\\sqrt{2}', '2.8284'),
  '\\sin^2 x+\\cos^2 x': exact('1'),
  '\\frac{d}{dx}\\sin x': exact('\\cos x'),
  'x^2-4=0': exact('x=\\pm 2'),
  '\\lim_{x\\to0}\\frac{\\sin x}{x}': exact('1'),
  '\\sum_{i=1}^{n} i': exact('\\frac{n(n+1)}{2}'),
  '\\int_0^1 e^{x^2}\\,dx': approxOnly('1.4627'),
  '3!': exact('6', '6'),
  // Explicit error fixtures (testable):
  '\\badinput': err('parse'),
  '\\int e^{x^3}\\,dx': err('timeout'),
  '\\int\\frac{1}{\\ln x}\\,dx': err('no_closed_form'),
};

const MIN_DELAY = 300;
const RAND_DELAY = 500;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Pseudo-random short decimal for the unmatched "echo" fallback. */
function randomApprox(): string {
  return (Math.random() * 10).toFixed(4);
}

/**
 * Mock evaluation. Resolves a CASResponse after a 300–800ms latency
 * (except empty input, which returns immediately with an error).
 */
export async function mockEval(latex: string): Promise<CASResponse> {
  const trimmed = latex.trim();
  if (trimmed === '') {
    return err('empty_input'); // no delay
  }

  await delay(MIN_DELAY + Math.random() * RAND_DELAY);

  const hit = CANNED[trimmed];
  if (hit) return hit;

  // Unmatched, non-empty input → echo with a random approximate (never errors).
  return {
    exact_latex: trimmed,
    approx_latex: randomApprox(),
    is_approx: false,
    error: null,
  };
}
