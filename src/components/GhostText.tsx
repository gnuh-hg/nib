import { useI18n } from '@/hooks/useI18n';

/**
 * Faint hint on the first empty ruled line when the document has no user blocks
 * (design.md §4.5). Fades out once the first block is created. First-run only —
 * does NOT consume the contextual-tip quota.
 */
export function GhostText({ visible }: { visible: boolean }) {
  const { t } = useI18n();
  return (
    <div className="nib-ghost" data-visible={visible} aria-hidden="true">
      {t('editor.empty_hint')}
    </div>
  );
}
