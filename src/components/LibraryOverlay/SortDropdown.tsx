import { useI18n } from '@/hooks/useI18n';
import { IconCheck } from '../icons';
import type { I18nKey } from '@/providers/i18n-context';
import type { SortKey } from '@/types/doc';

interface SortDropdownProps {
  sortKey: SortKey;
  onSelect: (k: SortKey) => void;
  onClose: () => void;
}

const OPTIONS: { key: SortKey; label: I18nKey }[] = [
  { key: 'modified', label: 'library.sort_modified' },
  { key: 'name', label: 'library.sort_name' },
  { key: 'created', label: 'library.sort_created' },
];

/** Sort options popover (design dòng 322–326). Active option shows a check. */
export function SortDropdown({ sortKey, onSelect, onClose }: SortDropdownProps) {
  const { t } = useI18n();

  return (
    <>
      <div className="nib-lib-popover-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="nib-lib-sort" role="menu">
        {OPTIONS.map(({ key, label }) => {
          const active = key === sortKey;
          return (
            <button
              key={key}
              type="button"
              role="menuitemradio"
              aria-checked={active}
              className="nib-lib-sort__opt"
              data-active={active}
              onClick={() => onSelect(key)}
            >
              <span className="nib-lib-sort__check" aria-hidden="true">
                {active && <IconCheck width={13} height={13} />}
              </span>
              {t(label)}
            </button>
          );
        })}
      </div>
    </>
  );
}
