import { useI18n } from '@/hooks/useI18n';

interface DeleteModalProps {
  docName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Delete confirmation modal (design dòng 337–345). Danger action uses --error. */
export function DeleteModal({ docName, onConfirm, onCancel }: DeleteModalProps) {
  const { t } = useI18n();

  return (
    <div
      className="nib-lib-delete"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div className="nib-lib-delete__box" onClick={(e) => e.stopPropagation()}>
        <div className="nib-lib-delete__title">
          {t('library.delete_title', { name: docName })}
        </div>
        <div className="nib-lib-delete__msg">{t('library.delete_msg')}</div>
        <div className="nib-lib-delete__actions">
          <button
            type="button"
            className="nib-lib-btn nib-lib-btn--ghost"
            onClick={onCancel}
          >
            {t('library.cancel')}
          </button>
          <button
            type="button"
            className="nib-lib-btn nib-lib-btn--danger"
            onClick={onConfirm}
          >
            {t('library.confirm_delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
