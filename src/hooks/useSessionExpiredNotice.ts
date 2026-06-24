// Session-exit handling for Nib (accounts-cloud-sync Phase D).
//
// Distinguishes a *deliberate* sign-out (the user clicked "Sign out") from an
// *involuntary* one (the Supabase session expired / was revoked — the refresh
// token failed). Both surface as a SIGNED_OUT auth event, so we mark intentional
// sign-outs with a module-level flag the SIGNED_OUT handler then consumes.

import { useCallback, useEffect, useState } from 'react';
import { onAuthStateChange, signOut } from '@/lib/auth';

// Set right before a user-initiated sign-out; read-and-reset by the handler.
let intentional = false;

/**
 * Sign out, flagging it as user-initiated so the session-expired notice stays
 * hidden. Use this everywhere the user explicitly signs out (AccountChip menu,
 * Settings → Account). Returns the same shape as `auth.signOut`.
 */
export function signOutIntentional(): Promise<{ error: Error | null }> {
  intentional = true;
  return signOut();
}

/** Read and reset the intentional-sign-out flag (true = user-initiated). */
function consumeIntentionalSignOut(): boolean {
  const value = intentional;
  intentional = false;
  return value;
}

export interface SessionExpiredNotice {
  /** True when the session ended involuntarily and the user should sign in again. */
  expired: boolean;
  /** Hide the notice (e.g. after the user opens the login modal or dismisses it). */
  dismiss: () => void;
}

/**
 * Surfaces an involuntary sign-out so the UI can prompt the user to sign back in
 * (keeping their local document intact — IndexedDB is never cleared on sign-out).
 * A deliberate sign-out via `signOutIntentional` is suppressed; a later SIGNED_IN
 * clears any pending notice.
 */
export function useSessionExpiredNotice(): SessionExpiredNotice {
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const sub = onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        if (!consumeIntentionalSignOut()) setExpired(true);
      } else if (event === 'SIGNED_IN') {
        setExpired(false);
      }
    });
    return () => sub.unsubscribe();
  }, []);

  const dismiss = useCallback(() => setExpired(false), []);

  return { expired, dismiss };
}
