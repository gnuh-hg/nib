// jsdom polyfills for the editor under test.
import { vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Unmount React trees between tests so RTL queries stay isolated.
afterEach(() => {
  cleanup();
});

// jsdom lacks matchMedia; GSAP's matchMedia() + prefers-reduced-motion need it.
// Assign unconditionally (jsdom leaves it undefined and GSAP calls it directly).
const mediaStub = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
});
window.matchMedia = mediaStub as unknown as typeof window.matchMedia;
vi.stubGlobal('matchMedia', mediaStub);

// Never touch real Supabase in unit tests. Mocking at the package level catches
// every import path (`@/lib/supabase`, relative imports from auth.ts, etc.) so
// no test can make a network call to a real Supabase project.
vi.mock('@supabase/supabase-js', () => {
  const authStub = {
    signInWithPassword: vi.fn(async () => ({ data: { user: null, session: null }, error: null })),
    signOut: vi.fn(async () => ({ error: null })),
    getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  };
  return {
    createClient: vi.fn(() => ({ auth: authStub })),
  };
});

// ResizeObserver is used by NibBlockView's clamp effect; jsdom lacks it.
class MockResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
vi.stubGlobal('ResizeObserver', MockResizeObserver);

if (!('randomUUID' in crypto)) {
  // @ts-expect-error - augment for jsdom
  crypto.randomUUID = () => `test-${Math.random().toString(36).slice(2)}`;
}
