import { useState } from 'react';
import { mathMarkup } from '@/services/mathMarkup';
import { useI18n } from '@/hooks/useI18n';

interface ResultViewProps {
  inputLatex: string;
  exactLatex: string;
  approxLatex: string;
  isApprox: boolean;
  /** Click the rendered result → back to editing (Typora-style). */
  onEdit: () => void;
}

/**
 * Seamless result render (design.md §6, §7): input = result, distinguished by
 * color only (no box). MathLive static markup; exact=--result, approx=--approx.
 * Badge ≈ + inline exact↔decimal toggle for approximate results.
 */
export function ResultView({
  inputLatex,
  exactLatex,
  approxLatex,
  isApprox,
  onEdit,
}: ResultViewProps) {
  const { t } = useI18n();
  const hasExact = exactLatex !== '';
  const hasApprox = approxLatex !== '';
  const hasBoth = hasExact && hasApprox;

  // Default view: exact when available, else approx.
  const [showExact, setShowExact] = useState(hasExact);

  const showingApprox = !(showExact && hasExact);
  const displayLatex = showingApprox ? approxLatex || exactLatex : exactLatex;

  return (
    <div
      className="nib-result"
      data-approx={showingApprox}
      onClick={onEdit}
      role="button"
      tabIndex={0}
    >
      <span
        className="nib-result__input"
        dangerouslySetInnerHTML={mathMarkup(inputLatex)}
      />
      <span className="nib-result__eq" aria-hidden="true">
        {showingApprox ? '≈' : '='}
      </span>

      {isApprox && (
        <span
          className="nib-badge-approx"
          aria-label="Approximate"
          title={t('result.approx_tooltip')}
        >
          ≈
        </span>
      )}

      <span
        className="nib-result__value"
        data-kind={showingApprox ? 'approx' : 'exact'}
        dangerouslySetInnerHTML={mathMarkup(displayLatex)}
      />

      {hasBoth && (
        <span
          className="nib-result__chips"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="nib-chip"
            data-active={showExact}
            onClick={() => setShowExact(true)}
          >
            {t('result.toggle_exact')}
          </button>
          <button
            type="button"
            className="nib-chip"
            data-active={!showExact}
            onClick={() => setShowExact(false)}
          >
            {t('result.toggle_decimal')}
          </button>
        </span>
      )}
    </div>
  );
}
