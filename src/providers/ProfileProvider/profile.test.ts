import { describe, it, expect } from 'vitest';
import {
  deriveInitials,
  deriveAvatarColor,
  AVATAR_SWATCHES,
} from './profile-context';

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
