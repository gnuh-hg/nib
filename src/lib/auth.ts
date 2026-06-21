// Auth module for Nib (Accounts + Cloud Sync — Phase A, Session A.1).
//
// Thin, typed wrapper around `supabase.auth.*` so the rest of the app never
// touches the Supabase client directly. Token storage (secure keyring) and
// ProfileProvider wiring land in Sessions A.2 / A.3 — not here.

import type {
  AuthChangeEvent,
  AuthResponse,
  Session,
  Subscription,
} from '@supabase/supabase-js';
import { supabase } from './supabase';

/**
 * Sign in with email + password. Resolves to the full Supabase AuthResponse
 * ({ data, error }); callers inspect `error` to surface a localized message.
 */
export function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return supabase.auth.signInWithPassword({ email, password });
}

/**
 * Create a new account with email + password. Resolves to the full Supabase
 * AuthResponse; callers inspect `error` (e.g. email already in use).
 */
export function signUpWithEmail(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return supabase.auth.signUp({ email, password });
}

/** Sign the current user out (clears the local session). */
export function signOut(): Promise<{ error: Error | null }> {
  return supabase.auth.signOut();
}

/** Return the current session (or null if signed out). */
export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Subscribe to auth state changes (SIGNED_IN / SIGNED_OUT / TOKEN_REFRESHED …).
 * Returns the Subscription so the caller can `.unsubscribe()` on unmount.
 */
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
): Subscription {
  const { data } = supabase.auth.onAuthStateChange(callback);
  return data.subscription;
}
