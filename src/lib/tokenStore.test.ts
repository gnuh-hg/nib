import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { invoke } from '@tauri-apps/api/core';

// Mock the Tauri IPC bridge so we can drive resolve/reject per-test.
vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

// Control onAuthStateChange to test the SIGNED_IN/SIGNED_OUT sync hook.
const authCallbackRef: {
  cb: ((event: string, session: unknown) => void) | null;
} = { cb: null };
vi.mock('./auth', () => ({
  onAuthStateChange: vi.fn((cb: (event: string, session: unknown) => void) => {
    authCallbackRef.cb = cb;
    return { unsubscribe: vi.fn() };
  }),
}));

import {
  saveToken,
  loadToken,
  clearToken,
  initTokenSync,
  TOKEN_FALLBACK_KEY,
} from './tokenStore';

const mockInvoke = invoke as unknown as Mock;

beforeEach(() => {
  mockInvoke.mockReset();
  localStorage.clear();
  authCallbackRef.cb = null;
});

describe('tokenStore — keychain path (invoke resolves)', () => {
  it('saveToken uses keychain and does NOT write localStorage', async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    await saveToken('tok-123');
    expect(mockInvoke).toHaveBeenCalledWith('save_token', { token: 'tok-123' });
    expect(localStorage.getItem(TOKEN_FALLBACK_KEY)).toBeNull();
  });

  it('loadToken returns the keychain value', async () => {
    mockInvoke.mockResolvedValueOnce('tok-from-keychain');
    expect(await loadToken()).toBe('tok-from-keychain');
  });

  it('loadToken returns null when keychain has no token', async () => {
    mockInvoke.mockResolvedValueOnce(null);
    expect(await loadToken()).toBeNull();
  });

  it('clearToken calls keychain and also clears the fallback', async () => {
    localStorage.setItem(TOKEN_FALLBACK_KEY, 'stale');
    mockInvoke.mockResolvedValueOnce(undefined);
    await clearToken();
    expect(mockInvoke).toHaveBeenCalledWith('clear_token');
    expect(localStorage.getItem(TOKEN_FALLBACK_KEY)).toBeNull();
  });
});

describe('tokenStore — fallback path (invoke rejects = no keychain)', () => {
  it('saveToken falls back to localStorage', async () => {
    mockInvoke.mockRejectedValueOnce('keychain unavailable');
    await saveToken('tok-fallback');
    expect(localStorage.getItem(TOKEN_FALLBACK_KEY)).toBe('tok-fallback');
  });

  it('loadToken reads the localStorage fallback', async () => {
    localStorage.setItem(TOKEN_FALLBACK_KEY, 'tok-fallback');
    mockInvoke.mockRejectedValueOnce('daemon down');
    expect(await loadToken()).toBe('tok-fallback');
  });

  it('loadToken returns null when both keychain and fallback are empty', async () => {
    mockInvoke.mockRejectedValueOnce('daemon down');
    expect(await loadToken()).toBeNull();
  });

  it('clearToken removes the fallback even when keychain rejects', async () => {
    localStorage.setItem(TOKEN_FALLBACK_KEY, 'tok-fallback');
    mockInvoke.mockRejectedValueOnce('daemon down');
    await clearToken();
    expect(localStorage.getItem(TOKEN_FALLBACK_KEY)).toBeNull();
  });
});

describe('tokenStore — initTokenSync auth hook', () => {
  it('SIGNED_IN saves the access_token; SIGNED_OUT clears it', async () => {
    mockInvoke.mockResolvedValue(undefined);
    initTokenSync();
    expect(authCallbackRef.cb).toBeTypeOf('function');

    authCallbackRef.cb?.('SIGNED_IN', { access_token: 'tok-signed-in' });
    await Promise.resolve();
    expect(mockInvoke).toHaveBeenCalledWith('save_token', { token: 'tok-signed-in' });

    authCallbackRef.cb?.('SIGNED_OUT', null);
    await Promise.resolve();
    expect(mockInvoke).toHaveBeenCalledWith('clear_token');
  });

  it('ignores SIGNED_IN without an access_token', async () => {
    initTokenSync();
    authCallbackRef.cb?.('SIGNED_IN', null);
    await Promise.resolve();
    expect(mockInvoke).not.toHaveBeenCalledWith('save_token', expect.anything());
  });
});
