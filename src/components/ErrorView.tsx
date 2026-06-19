import { useI18n } from '@/hooks/useI18n';
import type { I18nKey } from '@/providers/i18n-context';
import type { ErrorKind } from '@/types/block';

const ERROR_KEY: Record<Exclude<ErrorKind, ''>, I18nKey> = {
  empty_input: 'editor.no_active_block_tip',
  parse: 'error.parse',
  timeout: 'error.timeout',
  no_closed_form: 'error.no_closed_form',
};

interface ErrorViewProps {
  kind: ErrorKind;
  onFix: () => void;
}

/** ERROR state (design.md §5.2): warning icon + i18n message + "Fix" CTA. */
export function ErrorView({ kind, onFix }: ErrorViewProps) {
  const { t } = useI18n();
  const key: I18nKey = kind ? ERROR_KEY[kind] : 'error.parse';

  return (
    <div className="nib-error" role="alert">
      <svg
        className="nib-error__icon"
        viewBox="0 0 24 24"
        width="18"
        height="18"
        aria-hidden="true"
      >
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3 2 20h20L12 3zM12 10v5M12 18h.01"
        />
      </svg>
      <span className="nib-error__msg">{t(key)}</span>
      <button type="button" className="nib-error__fix" onClick={onFix}>
        {t('editor.error_fix_cta')}
      </button>
    </div>
  );
}
