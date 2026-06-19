import { createContext, useContext } from 'react';

/**
 * Local, UI-only user profile (no auth, no backend — see settings-redesign plan).
 * Persisted to localStorage['nib-profile']. `avatarImage` is a reserved slot for
 * post-MVP photo upload (needs Tauri fs/dialog) — left undefined for now.
 */
export interface StoredProfile {
  displayName: string;
  email?: string;
  /** CSS custom-property name of the avatar swatch, e.g. '--swatch-teal'. */
  avatarColor: string;
  /** Reserved for post-MVP photo upload — currently unused. */
  avatarImage?: string;
}

/** Profile as consumed by the UI: stored fields + derived initials. */
export interface ProfileData extends StoredProfile {
  /** Derived at render time from displayName — never persisted. */
  avatarInitials: string;
}

export interface ProfileContextValue {
  profile: ProfileData;
  setDisplayName: (name: string) => void;
  setEmail: (email: string) => void;
  // setAvatarImage reserved for post-MVP photo upload.
}

export const PROFILE_STORAGE_KEY = 'nib-profile';

/**
 * Stable avatar swatch palette — 8 named swatch tokens (tokens.css).
 * `deriveAvatarColor` hashes the display name into this list so the colour is
 * deterministic per name (never random per render).
 */
export const AVATAR_SWATCHES = [
  '--swatch-teal',
  '--swatch-blue',
  '--swatch-green',
  '--swatch-red',
  '--swatch-purple',
  '--swatch-rose',
  '--swatch-orange',
  '--swatch-slate',
] as const;

/**
 * Initials from a display name:
 *   ''            → '?'
 *   'Hung'        → 'H'
 *   'Nguyen Hai'  → 'NH'  (first + last word initials, uppercased)
 */
export function deriveInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0][0].toUpperCase();
  const first = words[0][0];
  const last = words[words.length - 1][0];
  return (first + last).toUpperCase();
}

/**
 * Stable swatch-token name for a display name. Empty name → first swatch.
 * Uses a simple deterministic string hash so the same name always maps to the
 * same swatch (no randomness, survives reload).
 */
export function deriveAvatarColor(name: string): string {
  const trimmed = name.trim();
  if (trimmed === '') return AVATAR_SWATCHES[0];
  let hash = 0;
  for (let i = 0; i < trimmed.length; i++) {
    hash = (hash * 31 + trimmed.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % AVATAR_SWATCHES.length;
  return AVATAR_SWATCHES[idx];
}

export const ProfileContext = createContext<ProfileContextValue | null>(null);

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error('useProfile must be used within <ProfileProvider>');
  }
  return ctx;
}
