import { useEffect, useState } from 'react';

export interface PointerCapabilities {
  /** Has a fine pointer (mouse/trackpad). */
  hasFine: boolean;
  /** Has a coarse pointer (touch). */
  hasCoarse: boolean;
  /** A pen/stylus has been observed at runtime. */
  hasPen: boolean;
}

/**
 * Detect input modalities (design.md §2.4). Media queries cover fine/coarse;
 * pen is confirmed at runtime via pointerType (iPad+Pencil is both pen & coarse).
 */
export function usePointerType(): PointerCapabilities {
  const [caps, setCaps] = useState<PointerCapabilities>(() => ({
    hasFine:
      typeof window !== 'undefined' &&
      window.matchMedia('(pointer: fine)').matches,
    hasCoarse:
      typeof window !== 'undefined' &&
      window.matchMedia('(pointer: coarse)').matches,
    hasPen: false,
  }));

  useEffect(() => {
    const fineMq = window.matchMedia('(pointer: fine)');
    const coarseMq = window.matchMedia('(pointer: coarse)');
    const update = () =>
      setCaps((c) => ({
        ...c,
        hasFine: fineMq.matches,
        hasCoarse: coarseMq.matches,
      }));
    fineMq.addEventListener('change', update);
    coarseMq.addEventListener('change', update);

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType === 'pen') {
        setCaps((c) => (c.hasPen ? c : { ...c, hasPen: true }));
      }
    };
    window.addEventListener('pointerdown', onPointer);

    return () => {
      fineMq.removeEventListener('change', update);
      coarseMq.removeEventListener('change', update);
      window.removeEventListener('pointerdown', onPointer);
    };
  }, []);

  return caps;
}
