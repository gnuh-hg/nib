import { describe, it, expect } from 'vitest';
import type { Session } from '@supabase/supabase-js';
import {
  deriveInitials,
  deriveAvatarColor,
  deriveProfile,
  AVATAR_SWATCHES,
  type StoredProfile,
} from './profile-context';

/** Minimal Session stub for derive tests (only fields deriveProfile reads). */
function mkSession(email: string | undefined, id = 'user-1'): Session {
  return { user: { id, email } } as unknown as Session;
}
const emptyStored: StoredProfile = {
  displayName: '',
  avatarColor: AVATAR_SWATCHES[0],
};

describe('deriveInitials', () => {
  it("returns '?' for an empty name", () => {
    expect(deriveInitials('')).toBe('?');
    expect(deriveInitials('   ')).toBe('?');
  });

  it('returns the single initial for a one-word name', () => {
    expect(deriveInitials('Hung')).toBe('H');
    expect(deriveInitials('hung')).toBe('H');
  });

  it('returns first + last initials for a multi-word name', () => {
    expect(deriveInitials('Nguyen Hai')).toBe('NH');
    expect(deriveInitials('Nguyen Van Hai')).toBe('NH');
    expect(deriveInitials('  ada   lovelace  ')).toBe('AL');
  });
});

describe('deriveAvatarColor', () => {
  it('returns the first swatch for an empty name', () => {
    expect(deriveAvatarColor('')).toBe(AVATAR_SWATCHES[0]);
    expect(deriveAvatarColor('  ')).toBe(AVATAR_SWATCHES[0]);
  });

  it('always returns a valid swatch token name', () => {
    for (const name of ['Hung', 'Nguyen Hai', 'Ada', 'Z', 'longish name here']) {
      expect(AVATAR_SWATCHES).toContain(deriveAvatarColor(name) as never);
    }
  });

  it('is stable (same name → same swatch across calls)', () => {
    expect(deriveAvatarColor('Nguyen Hai')).toBe(deriveAvatarColor('Nguyen Hai'));
    expect(deriveAvatarColor('Hung')).toBe(deriveAvatarColor('Hung'));
  });
});

describe('deriveProfile (Supabase session → UI profile)', () => {
  it('returns null when there is no session (signed-out / guest)', () => {
    expect(deriveProfile(null, emptyStored)).toBeNull();
  });

  it('reflects the Supabase user when signed in', () => {
    const p = deriveProfile(mkSession('ada@nib.app', 'uid-42'), emptyStored);
    expect(p).not.toBeNull();
    expect(p?.id).toBe('uid-42');
    expect(p?.email).toBe('ada@nib.app');
    // displayName falls back to the email local-part when not set locally.
    expect(p?.displayName).toBe('ada');
    expect(p?.avatarInitials).toBe('A');
  });

  it('layers local stored overrides on top of the Supabase identity', () => {
    const stored: StoredProfile = {
      displayName: 'Ada Lovelace',
      email: 'override@nib.app',
      avatarColor: '--swatch-purple',
    };
    const p = deriveProfile(mkSession('ada@nib.app', 'uid-7'), stored);
    expect(p?.id).toBe('uid-7');
    expect(p?.displayName).toBe('Ada Lovelace'); // local override wins
    expect(p?.email).toBe('override@nib.app'); // local override wins
    expect(p?.avatarColor).toBe('--swatch-purple');
    expect(p?.avatarInitials).toBe('AL');
  });

  it('handles a session whose user has no email', () => {
    const p = deriveProfile(mkSession(undefined, 'uid-9'), emptyStored);
    expect(p?.id).toBe('uid-9');
    expect(p?.email).toBeUndefined();
    expect(p?.displayName).toBe('');
    expect(p?.avatarInitials).toBe('?');
  });
});
