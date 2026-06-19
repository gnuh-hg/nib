import katex from 'katex';

/**
 * Static LaTeX → HTML markup for read-only display (results, input echo).
 * Rendered with KaTeX (Computer Modern fonts, design.md §6.1). KaTeX glyphs use
 * `currentColor`, so we tint via the container `color: var(--result|--approx)`.
 * `throwOnError:false` → invalid LaTeX renders in KaTeX's error style instead of
 * crashing the block.
 */
export function mathMarkup(latex: string): { __html: string } {
  if (!latex) return { __html: '' };
  try {
    return {
      __html: katex.renderToString(latex, {
        throwOnError: false,
        displayMode: false,
        output: 'html',
      }),
    };
  } catch {
    return { __html: '' };
  }
}
