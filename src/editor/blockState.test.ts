import { describe, it, expect } from 'vitest';
import { transition, isResult } from './blockState';
import { resultToAttrs } from './evalResult';

describe('block state machine', () => {
  it('focus events set the editing/ink state', () => {
    expect(transition('empty', 'focus-math')).toBe('editing-math');
    expect(transition('empty', 'focus-text')).toBe('editing-text');
    expect(transition('editing-math', 'capture-ink')).toBe('ink-capture');
  });

  it('eval lifecycle: editing → evaluating → result', () => {
    expect(transition('editing-math', 'start-eval')).toBe('evaluating');
    expect(transition('evaluating', 'result-exact')).toBe('result-exact');
    expect(transition('evaluating', 'result-approx')).toBe('result-approx');
    expect(transition('evaluating', 'error')).toBe('error');
  });

  it('clicking a result/error returns to editing-math (Typora)', () => {
    expect(transition('result-exact', 'edit-again')).toBe('editing-math');
    expect(transition('error', 'edit-again')).toBe('editing-math');
  });

  it('unknown (state,event) keeps the current state', () => {
    expect(transition('result-exact', 'capture-ink')).toBe('ink-capture'); // valid
    expect(transition('result-exact', 'result-exact')).toBe('result-exact');
  });

  it('isResult identifies result states', () => {
    expect(isResult('result-exact')).toBe(true);
    expect(isResult('result-approx')).toBe(true);
    expect(isResult('evaluating')).toBe(false);
  });
});

describe('resultToAttrs (CAS response → block attrs)', () => {
  it('exact result', () => {
    expect(
      resultToAttrs({
        exact_latex: '2x',
        approx_latex: null,
        is_approx: false,
        error: null,
      }),
    ).toEqual({
      blockState: 'result-exact',
      exactLatex: '2x',
      approxLatex: '',
      isApprox: false,
    });
  });

  it('approx result', () => {
    expect(
      resultToAttrs({
        exact_latex: null,
        approx_latex: '1.4627',
        is_approx: true,
        error: null,
      }),
    ).toEqual({
      blockState: 'result-approx',
      exactLatex: '',
      approxLatex: '1.4627',
      isApprox: true,
    });
  });

  it('error result', () => {
    expect(
      resultToAttrs({
        exact_latex: null,
        approx_latex: null,
        is_approx: false,
        error: 'parse',
      }),
    ).toEqual({ blockState: 'error', errorKind: 'parse' });
  });
});
