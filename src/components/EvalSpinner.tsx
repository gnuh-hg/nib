import { useEffect, useState } from 'react';

/**
 * Inline spinner shown at the `=` position during EVALUATING. Debounced 150ms:
 * if the eval finishes faster, the spinner never flashes (design.md §5.3).
 * Respects prefers-reduced-motion via CSS (pulse dot instead of rotation).
 */
export function EvalSpinner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setVisible(true), 150);
    return () => window.clearTimeout(id);
  }, []);

  if (!visible) return null;
  return <span className="nib-eval-spinner" role="status" aria-live="polite" />;
}
