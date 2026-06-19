import { useI18n } from '@/hooks/useI18n';
import type { I18nKey } from '@/providers/i18n-context';
import { IconClose } from './icons';

interface ContextualTipProps {
  tipKey: I18nKey | null;
  onDismiss: () => void;
}

/** Single dismissible contextual tip (design.md §4.5). */
export function ContextualTip({ tipKey, onDismiss }: ContextualTipProps) {
  const { t } = useI18n();
  if (!tipKey) return null;
  return (
    <div className="nib-tip" role="status">
      <span className="nib-tip__msg">{t(tipKey)}</span>
      <button
        type="button"
        className="nib-tip__close"
        onClick={onDismiss}
        aria-label={t('tip.dismiss')}
      >
        <IconClose width={16} height={16} />
      </button>
    </div>
  );
}
