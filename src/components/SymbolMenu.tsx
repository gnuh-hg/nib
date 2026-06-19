import './symbolmenu.css';
import { useI18n } from '@/hooks/useI18n';
import type { I18nKey } from '@/providers/i18n-context';

export interface SymbolMenuItem {
  id: string;
  labelKey: I18nKey;
  /** LaTeX seed to insert; '' = empty math block, null = text block. */
  latex: string | null;
}

export const SYMBOL_ITEMS: SymbolMenuItem[] = [
  { id: 'math', labelKey: 'symbol.new_math', latex: '' },
  { id: 'text', labelKey: 'symbol.new_text', latex: null },
  { id: 'sqrt', labelKey: 'symbol.sqrt', latex: '\\sqrt{}' },
  { id: 'sum', labelKey: 'symbol.sum', latex: '\\sum_{i=1}^{n}' },
  { id: 'int', labelKey: 'symbol.integral', latex: '\\int' },
  { id: 'frac', labelKey: 'symbol.frac', latex: '\\frac{}{}' },
];

interface SymbolMenuProps {
  x: number;
  y: number;
  onPick: (item: SymbolMenuItem) => void;
  onClose: () => void;
}

/**
 * Document-level `\` menu (design.md §7 Lớp 1): insert a block or symbol when
 * typing `\` outside a block. (`/` stays division.)
 */
export function SymbolMenu({ x, y, onPick, onClose }: SymbolMenuProps) {
  const { t } = useI18n();
  return (
    <>
      <div className="nib-symbol-backdrop" onPointerDown={onClose} />
      <div className="nib-symbol-menu" style={{ top: y, left: x }} role="menu">
        {SYMBOL_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            className="nib-symbol-item"
            onClick={() => onPick(item)}
          >
            {t(item.labelKey)}
          </button>
        ))}
      </div>
    </>
  );
}
