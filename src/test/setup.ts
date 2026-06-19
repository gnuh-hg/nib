// jsdom polyfills for the editor under test.
import { vi } from 'vitest';

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
