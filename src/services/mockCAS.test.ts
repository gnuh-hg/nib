import { describe, it, expect } from 'vitest';
import { mockEval, CANNED } from './mockCAS';

describe('mockCAS', () => {
  it('has ≥10 canned fixtures', () => {
    expect(Object.keys(CANNED).length).toBeGreaterThanOrEqual(10);
  });

  it('returns the exact canned response for every fixture key', async () => {
    const entries = Object.entries(CANNED);
    const results = await Promise.all(entries.map(([k]) => mockEval(k)));
    entries.forEach(([, expected], i) => {
      expect(results[i]).toEqual(expected);
    });
  });

  it('\\frac{d}{dx}x^2 → 2x (exact, not approximate)', async () => {
    const r = await mockEval('\\frac{d}{dx}x^2');
    expect(r.exact_latex).toBe('2x');
    expect(r.is_approx).toBe(false);
    expect(r.error).toBeNull();
  });

  it('\\int_0^1 e^{x^2}\\,dx → approx-only (is_approx true, exact null)', async () => {
    const r = await mockEval('\\int_0^1 e^{x^2}\\,dx');
    expect(r.is_approx).toBe(true);
    expect(r.exact_latex).toBeNull();
    expect(r.approx_latex).toBe('1.4627');
  });

  it('\\badinput → parse error', async () => {
    const r = await mockEval('\\badinput');
    expect(r.error).toBe('parse');
  });

  it('\\int e^{x^3}\\,dx → timeout error', async () => {
    const r = await mockEval('\\int e^{x^3}\\,dx');
    expect(r.error).toBe('timeout');
  });

  it('empty input → empty_input error, returned immediately', async () => {
    const start = Date.now();
    const r = await mockEval('   ');
    expect(r.error).toBe('empty_input');
    expect(Date.now() - start).toBeLessThan(100); // no artificial delay
  });

  it('unmatched non-empty input → echoes latex with a random approx (no error)', async () => {
    const r = await mockEval('\\zeta(3)');
    expect(r.error).toBeNull();
    expect(r.exact_latex).toBe('\\zeta(3)');
    expect(typeof r.approx_latex).toBe('string');
  });
});
