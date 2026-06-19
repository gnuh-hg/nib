import { useI18n } from '@/hooks/useI18n';
import {
  IconSearch,
  IconLayoutGrid,
  IconList,
  IconSortLines,
  IconChevronDown,
} from '../icons';
import type { SortKey, ViewMode } from '@/types/doc';

interface LibraryToolbarProps {
  viewMode: ViewMode;
  sortKey: SortKey;
  onChangeViewMode: (m: ViewMode) => void;
  onToggleSort: () => void;
}

const SORT_LABEL: Record<SortKey, 'library.sort_modified' | 'library.sort_name' | 'library.sort_created'> = {
  modified: 'library.sort_modified',
  name: 'library.sort_name',
  created: 'library.sort_created',
};

/** Library toolbar (design dòng 248–255): search + grid/list toggle + sort. */
export function LibraryToolbar({
  viewMode,
  sortKey,
  onChangeViewMode,
  onToggleSort,
}: LibraryToolbarProps) {
  const { t } = useI18n();

  return (
    <div className="nib-lib-toolbar">
      <div className="nib-lib-search">
        <IconSearch width={14} height={14} className="nib-lib-search__icon" />
        <input
          type="text"
          className="nib-lib-search__input"
          placeholder={t('library.search_placeholder')}
          aria-label={t('library.search_placeholder')}
        />
      </div>

      <div className="nib-lib-viewtoggle" role="group">
        <button
          type="button"
          className="nib-lib-viewtoggle__btn"
          data-active={viewMode === 'grid'}
          onClick={() => onChangeViewMode('grid')}
          title={t('library.view_grid')}
          aria-label={t('library.view_grid')}
          aria-pressed={viewMode === 'grid'}
        >
          <IconLayoutGrid width={14} height={14} />
        </button>
        <button
          type="button"
          className="nib-lib-viewtoggle__btn"
          data-active={viewMode === 'list'}
          onClick={() => onChangeViewMode('list')}
          title={t('library.view_list')}
          aria-label={t('library.view_list')}
          aria-pressed={viewMode === 'list'}
        >
          <IconList width={14} height={14} />
        </button>
      </div>

      <button
        type="button"
        className="nib-lib-sortbtn"
        onClick={onToggleSort}
        title={t('library.sort')}
      >
        <IconSortLines width={13} height={13} />
        {t(SORT_LABEL[sortKey])}
        <IconChevronDown width={9} height={9} />
      </button>
    </div>
  );
}
