// Supabase client singleton for Nib (Accounts + Cloud Sync — Phase A, Session A.1).
//
// Reads config from Vite env vars (see `.env.example`):
//   VITE_SUPABASE_URL       — your project URL
//   VITE_SUPABASE_ANON_KEY  — public anon key (safe to ship to client)
//
// The actual values live in `.env.local` (gitignored). When they are absent
// (e.g. fresh clone, CI, or unit tests) we fall back to harmless placeholders
// so importing this module never throws — `createClient` requires non-empty
// url/key. Network calls only happen when auth helpers are actually invoked,
// and the test env mocks this module entirely (see `src/test/setup.ts`).

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL ?? '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

if (!url || !anonKey) {
  // Not an error at import time — only matters once auth is used.
  console.warn(
    '[supabase] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. ' +
      'Copy .env.example to .env.local and fill them in before signing in.',
  );
}

// Placeholders keep createClient from throwing when env is unset; any auth
// call against them simply fails at runtime instead of crashing the app boot.
const PLACEHOLDER_URL = 'http://localhost:54321';
const PLACEHOLDER_KEY = 'public-anon-key-placeholder';

export const supabase: SupabaseClient = createClient(
  url || PLACEHOLDER_URL,
  anonKey || PLACEHOLDER_KEY,
  {
    auth: {
      // Persist the session so the user stays signed in across reloads.
      // Phase A.2 will move token storage to a secure Tauri keyring.
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
);
