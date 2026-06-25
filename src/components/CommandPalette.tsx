import './palette.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Editor } from '@tiptap/react';
import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';
import type { I18nKey } from '@/providers/i18n-context';

interface CommandPaletteProps {
  editor: Editor | null;
  open: boolean;
  onClose: () => void;
}

interface Command {
  id: string;
  labelKey: I18nKey;
  shortcut?: string;
  run: () => void;
}

/** Ctrl/Cmd+K command palette (design.md §7 Lớp 3). */
export function CommandPalette({ editor, open, onClose }: CommandPaletteProps) {
  const { t, toggleLang } = useI18n();
  const { cycleTheme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);

  const commands = useMemo<Command[]>(() => {
    if (!editor) return [];
    return [
      {
        id: 'calc',
        labelKey: 'cmd.calc',
        shortcut: 'Shift+Enter',
        // TODO rebuild typing: wire calc once the new schema + CAS pipeline exist.
        run: () => {},
      },
      {
        id: 'convert',
        labelKey: 'cmd.convert',
        shortcut: 'Ctrl+Shift+M',
        // Phase B: convertNibBlock removed from schema. Wired in Phase D.
        run: () => {},
      },
      {
        id: 'undo',
        labelKey: 'cmd.undo',
        shortcut: 'Ctrl+Z',
        run: () => editor.storage.YjsSync?.undoManager?.undo(),
      },
      {
        id: 'redo',
        labelKey: 'cmd.redo',
        shortcut: 'Ctrl+Y',
        run: () => editor.storage.YjsSync?.undoManager?.redo(),
      },
      { id: 'theme', labelKey: 'cmd.toggle_theme', run: () => cycleTheme() },
      { id: 'lang', labelKey: 'cmd.toggle_lang', run: () => toggleLang() },
      {
        id: 'new-math',
        labelKey: 'cmd.new_math',
        // Phase B: insertNibBlock removed; insert via row command wired in Phase C/D.
        run: () => {},
      },
      {
        id: 'new-text',
        labelKey: 'cmd.new_text',
        // Phase B: insertNibBlock removed; insert via row command wired in Phase C/D.
        run: () => {},
      },
    ];
  }, [editor, cycleTheme, toggleLang]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => t(c.labelKey).toLowerCase().includes(q));
  }, [commands, query, t]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (index >= filtered.length) setIndex(Math.max(0, filtered.length - 1));
  }, [filtered, index]);

  if (!open) return null;

  const runAt = (i: number) => {
    const cmd = filtered[i];
    if (cmd) {
      cmd.run();
      onClose();
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndex((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      runAt(index);
    }
  };

  return createPortal(
    <div className="nib-palette-backdrop" onClick={onClose}>
      <div
        className="nib-palette"
        role="dialog"
        aria-modal="true"
        aria-label={t('cmd.title')}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <input
          ref={inputRef}
          className="nib-palette__input"
          value={query}
          placeholder={t('cmd.placeholder')}
          onChange={(e) => setQuery(e.target.value)}
        />
        <ul className="nib-palette__list" role="listbox">
          {filtered.map((c, i) => (
            <li
              key={c.id}
              role="option"
              aria-selected={i === index}
              className="nib-palette__item"
              data-active={i === index}
              onMouseEnter={() => setIndex(i)}
              onClick={() => runAt(i)}
            >
              <span>{t(c.labelKey)}</span>
              {c.shortcut && (
                <kbd className="nib-palette__kbd">{c.shortcut}</kbd>
              )}
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="nib-palette__empty">{t('cmd.no_results')}</li>
          )}
        </ul>
      </div>
    </div>,
    document.body,
  );
}
