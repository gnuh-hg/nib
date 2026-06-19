import type { CSSProperties } from 'react';
import type { Editor } from '@tiptap/react';
import { useI18n } from '@/hooks/useI18n';
import { FlyoutPanel } from './FlyoutPanel';

interface FormatFlyoutProps {
  open: boolean;
  editor: Editor | null;
  style?: CSSProperties;
}

type Mark = 'bold' | 'italic' | 'underline' | 'strike';

/**
 * Format flyout (Gõ/type mode only) — B/I/U/S row. Toggles text marks on the
 * active text block via editor.toggleMark. Second row is intentionally empty
 * per HTML v2.
 */
export function FormatFlyout({ open, editor, style }: FormatFlyoutProps) {
  const { t } = useI18n();

  const toggle = (mark: Mark) => () => {
    editor?.chain().focus().toggleMark(mark).run();
  };

  return (
    <FlyoutPanel
      open={open}
      title={t('dock.format_flyout_header')}
      className="nib-dock__flyout--fmt"
      style={style}
    >
      <div className="nib-dock__fmt-row">
        <button
          type="button"
          className="nib-dock__fmt-btn nib-dock__fmt-btn--b"
          title={t('toolbar.bold')}
          aria-label={t('toolbar.bold')}
          onMouseDown={(e) => e.preventDefault()}
          onClick={toggle('bold')}
        >
          B
        </button>
        <button
          type="button"
          className="nib-dock__fmt-btn nib-dock__fmt-btn--i"
          title={t('toolbar.italic')}
          aria-label={t('toolbar.italic')}
          onMouseDown={(e) => e.preventDefault()}
          onClick={toggle('italic')}
        >
          I
        </button>
        <button
          type="button"
          className="nib-dock__fmt-btn nib-dock__fmt-btn--u"
          title={t('toolbar.underline')}
          aria-label={t('toolbar.underline')}
          onMouseDown={(e) => e.preventDefault()}
          onClick={toggle('underline')}
        >
          U
        </button>
        <button
          type="button"
          className="nib-dock__fmt-btn nib-dock__fmt-btn--s"
          title={t('toolbar.strike')}
          aria-label={t('toolbar.strike')}
          onMouseDown={(e) => e.preventDefault()}
          onClick={toggle('strike')}
        >
          S
        </button>
      </div>
    </FlyoutPanel>
  );
}
