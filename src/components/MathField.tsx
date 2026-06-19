import { useEffect, useRef } from 'react';
import { MathfieldElement } from '@/editor/mathliveSetup';

interface MathFieldProps {
  value: string;
  autoFocus?: boolean;
  /** Live LaTeX on every keystroke (CAS is NOT called here). */
  onChange: (latex: string) => void;
  /** Shift+Enter → evaluate. */
  onEval: (latex: string) => void;
}

/**
 * Imperative wrapper around MathLive's <math-field>. Mounted once; external
 * value changes are synced in. WYSIWYG live render (x^2→x², \int→∫, …); CAS
 * runs only on eval (feature.md §3).
 */
export function MathField({ value, autoFocus, onChange, onEval }: MathFieldProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mfRef = useRef<MathfieldElement | null>(null);
  const onChangeRef = useRef(onChange);
  const onEvalRef = useRef(onEval);
  onChangeRef.current = onChange;
  onEvalRef.current = onEval;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const mf = new MathfieldElement();
    mf.value = value;
    mf.className = 'nib-mathfield';
    // Keep the virtual keyboard off on desktop (toolbar toggle arrives in 1.4).
    mf.mathVirtualKeyboardPolicy = 'manual';

    const handleInput = () => onChangeRef.current(mf.value);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        onEvalRef.current(mf.value);
      }
    };
    mf.addEventListener('input', handleInput);
    mf.addEventListener('keydown', handleKeyDown);

    host.appendChild(mf);
    mfRef.current = mf;
    if (autoFocus) {
      // focus after the element is connected
      requestAnimationFrame(() => mf.focus());
    }

    return () => {
      mf.removeEventListener('input', handleInput);
      mf.removeEventListener('keydown', handleKeyDown);
      mf.remove();
      mfRef.current = null;
    };
    // mount once — value sync handled by the effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const mf = mfRef.current;
    if (mf && mf.value !== value) mf.value = value;
  }, [value]);

  return <div className="nib-mathfield-host" ref={hostRef} />;
}
