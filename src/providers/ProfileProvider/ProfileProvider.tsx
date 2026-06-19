import { useCallback, useMemo, useState } from 'react';
import {
  ProfileContext,
  PROFILE_STORAGE_KEY,
  deriveAvatarColor,
  deriveInitials,
  type ProfileData,
  type StoredProfile,
} from './profile-context';

const DEFAULT_PROFILE: StoredProfile = {
  displayName: '',
  avatarColor: deriveAvatarColor(''),
};

/** Read + validate the stored profile (type-guard, falls back to default). */
function readStoredProfile(): StoredProfile {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as Record<string, unknown>).displayName === 'string'
    ) {
      const p = parsed as Record<string, unknown>;
      const displayName = p.displayName as string;
      return {
        displayName,
        email: typeof p.email === 'string' ? p.email : undefined,
        avatarColor:
          typeof p.avatarColor === 'string'
            ? p.avatarColor
            : deriveAvatarColor(displayName),
        avatarImage: typeof p.avatarImage === 'string' ? p.avatarImage : undefined,
      };
    }
  } catch {
    /* localStorage unavailable or corrupt — fall through to default */
  }
  return DEFAULT_PROFILE;
}

function persist(profile: StoredProfile): void {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    /* ignore persistence failure (pattern mirrors ThemeProvider) */
  }
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [stored, setStored] = useState<StoredProfile>(() => readStoredProfile());

  const setDisplayName = useCallback((name: string) => {
    setStored((prev) => {
      // Re-derive the avatar colour from the new name so it stays stable & in sync.
      const next: StoredProfile = {
        ...prev,
        displayName: name,
        avatarColor: deriveAvatarColor(name),
      };
      persist(next);
      return next;
    });
  }, []);

  const setEmail = useCallback((email: string) => {
    setStored((prev) => {
      const next: StoredProfile = { ...prev, email };
      persist(next);
      return next;
    });
  }, []);

  // avatarInitials is computed at render — never persisted.
  const profile: ProfileData = useMemo(
    () => ({ ...stored, avatarInitials: deriveInitials(stored.displayName) }),
    [stored],
  );

  const value = useMemo(
    () => ({ profile, setDisplayName, setEmail }),
    [profile, setDisplayName, setEmail],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}
