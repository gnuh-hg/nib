// Secure token storage for Nib (Accounts + Cloud Sync — Phase A, Session A.2).
//
// Wraps the Tauri keychain IPC commands (implemented in src-tauri/ by glue) and
// transparently falls back to localStorage when the OS keychain is unavailable
// (e.g. Linux without a running secret-service daemon, or when running outside
// Tauri — browser dev / vitest). All three commands REJECT with a string error
// when the keychain can't be reached; we catch and fall back.
//
// IPC contract (from glue):
//   invoke("save_token", { token })          -> Promise<void>   (reject: string)
//   invoke<string | null>("load_token")      -> string | null   (reject: string)
//   invoke("clear_token")                     -> Promise<void>   (reject: string, idempotent)

import { invoke } from '@tauri-apps/api/core';
import { onAuthStateChange } from './auth';

/** localStorage key used for the non-keychain fallback path. */
export const TOKEN_FALLBACK_KEY = 'nib-auth-token';

/** Safe localStorage access — guards environments where it may be missing. */
function lsGet(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}
function lsSet(key: string, value: string): void {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    /* ignore — no persistence available */
  }
}
function lsRemove(key: string): void {
  try {
    globalThis.localStorage?.removeItem(key);
  } catch {
    /* ignore */
  }
}

/**
 * Persist the auth token. Prefers the OS keychain via Tauri IPC; on any failure
 * (keychain daemon down, not running in Tauri) falls back to localStorage.
 */
export async function saveToken(token: string): Promise<void> {
  try {
    await invoke('save_token', { token });
  } catch {
    lsSet(TOKEN_FALLBACK_KEY, token);
  }
}

/**
 * Load the auth token. Tries the keychain first; on failure reads the
 * localStorage fallback. Returns null when neither has a token.
 */
export async function loadToken(): Promise<string | null> {
  try {
    const token = await invoke<string | null>('load_token');
    return token ?? null;
  } catch {
    return lsGet(TOKEN_FALLBACK_KEY);
  }
}

/**
 * Clear the auth token from both the keychain and the localStorage fallback.
 * Idempotent — safe to call when no token is stored.
 */
export async function clearToken(): Promise<void> {
  try {
    await invoke('clear_token');
  } catch {
    /* keychain unavailable — fall through to clear fallback */
  }
  // Always clear the fallback too, so a token saved via fallback never lingers.
  lsRemove(TOKEN_FALLBACK_KEY);
}

/**
 * Keep stored token in sync with auth state:
 *   SIGNED_IN  -> saveToken(session.access_token)
 *   SIGNED_OUT -> clearToken()
 *
 * Returns the auth subscription so the caller can `.unsubscribe()` on teardown.
 * Kept separate from the auth.ts wrappers so those stay side-effect-free.
 */
export function initTokenSync() {
  return onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.access_token) {
      void saveToken(session.access_token);
    } else if (event === 'SIGNED_OUT') {
      void clearToken();
    }
  });
}
