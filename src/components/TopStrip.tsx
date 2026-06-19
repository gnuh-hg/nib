import type { Editor } from '@tiptap/react';
import { useI18n } from '@/hooks/useI18n';
import type { DocEntry } from '@/types/doc';
import { IconLogo, IconUndo, IconRedo } from './icons';

interface TopStripProps {
  editor: Editor | null;
  docs: DocEntry[];
  activeDocId: string;
}

/**
 * Thin top strip (nav-dock-design §2). Instead of a single empty full-width bar,
 * it renders two rounded blocks hugging the edges with their corners rounded
 * toward the centre (user 2026-06-18). Left block: [logo | doc-title] — display
 * only, no switcher/rename interaction. Right block: undo + redo. Every string
 * via i18n; colors via tokens; all controls ≥44px hit target.
 */
export function TopStrip({ editor, docs, activeDocId }: TopStripProps) {
  const { t } = useI18n();

  const activeDoc = docs.find((d) => d.id === activeDocId);
  const title = activeDoc?.title ?? t('app.doc_title');

  return (
    <header className="nib-strip">
      <div className="nib-strip__block nib-strip__block--left">
        <IconLogo width={20} height={20} className="nib-strip__logo" />
        <span className="nib-strip__divider" aria-hidden="true" />
        <span className="nib-strip__doctitle-text">{title}</span>
      </div>

      <div className="nib-strip__block nib-strip__block--right">
        <button
          type="button"
          className="nib-strip__iconbtn"
          onClick={() => editor?.commands.undo()}
          title={t('strip.undo')}
          aria-label={t('strip.undo')}
        >
          <IconUndo width={19} height={19} />
        </button>
        <button
          type="button"
          className="nib-strip__iconbtn"
          onClick={() => editor?.commands.redo()}
          title={t('strip.redo')}
          aria-label={t('strip.redo')}
        >
          <IconRedo width={19} height={19} />
        </button>
      </div>
    </header>
  );
}
