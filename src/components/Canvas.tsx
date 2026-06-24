import './canvas.css';
import './blocks.css';
import '../editor/row-view.css';
import { type PointerEvent, type RefObject } from 'react';
import { EditorContent, type Editor } from '@tiptap/react';
import { useI18n } from '@/hooks/useI18n';
import { GhostText } from './GhostText';

interface CanvasProps {
  editor: Editor | null;
  paperRef: RefObject<HTMLDivElement>;
  onPointerDown: (e: PointerEvent<HTMLDivElement>) => void;
  total: number;
}

/**
 * Presentational canvas: the desk surface + the fixed-width paper sheet (margin
 * line, ruling, ghost hint, editor host, overlays). All editor state and
 * interaction handlers live in <Workspace>; this component only renders.
 *
 * Phase C.2 (materialize-on-click): the ghost-caret span and ghostPark prop are
 * removed. Virtual clicks now immediately insert a real PM row and place the cursor
 * inside it, so the browser's native blinking caret serves as the visual indicator.
 */
export function Canvas({ editor, paperRef, onPointerDown, total }: CanvasProps) {
  const { t } = useI18n();

  return (
    // Desk = the surface behind the sheet (var(--desk)); centers + scrolls the
    // fixed-width paper. position:static so the block offsetParent stays .nib-pm
    // (664px), not the viewport-wide desk (RISK#2).
    <div className="nib-desk">
      <div ref={paperRef} className="nib-paper" onPointerDown={onPointerDown}>
        <div className="nib-margin-line" aria-hidden="true" />
        <div className="nib-ruled-paper" aria-hidden="true" />
        <GhostText visible={total === 0} />
        <EditorContent editor={editor} className="nib-editor-host" />
        <div className="nib-selection-overlay" aria-hidden="true" />
        <div className="nib-hint-pill" aria-hidden="true">
          {t('app.canvas_hint')}
        </div>
      </div>
    </div>
  );
}
