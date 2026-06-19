import { useCallback, useState } from 'react';
import type { I18nKey } from '@/providers/i18n-context';

export type TipTrigger =
  | 'sqrt-first'
  | 'no-eval-30s'
  | 'first-approx'
  | 'first-selection';

const TIP_KEY: Record<TipTrigger, I18nKey> = {
  'sqrt-first': 'tip.sqrt',
  'no-eval-30s': 'tip.no_eval',
  'first-approx': 'tip.approx',
  'first-selection': 'tip.selection',
};

const SESSION_FLAG = 'nib-tip-shown';

function tipAlreadyShown(): boolean {
  try {
    return sessionStorage.getItem(SESSION_FLAG) === '1';
  } catch {
    return false;
  }
}

function markTipShown(): void {
  try {
    sessionStorage.setItem(SESSION_FLAG, '1');
  } catch {
    /* ignore */
  }
}

/**
 * Contextual tips (design.md §4.5): at most ONE tip per session for everyday use.
 * Starter content / ghost text (first-run) are NOT routed through here, so they
 * never consume the quota.
 */
export function useContextualTips() {
  const [tipKey, setTipKey] = useState<I18nKey | null>(null);

  const trigger = useCallback((t: TipTrigger) => {
    if (tipAlreadyShown()) return;
    markTipShown();
    setTipKey(TIP_KEY[t]);
  }, []);

  const dismiss = useCallback(() => setTipKey(null), []);

  return { tipKey, trigger, dismiss };
}
