import {
  useCallback,
  useLayoutEffect,
  useRef,
  type FocusEvent,
} from 'react';
import {
  NodeViewWrapper,
  NodeViewContent,
  type NodeViewProps,
} from '@tiptap/react';
import { useEditorContext } from './editor-context';
import { clampRenderX, isClampedLeftward, RULE_HEIGHT } from './geometry';
import { MathField } from '@/components/MathField';
import { ResultView } from '@/components/ResultView';
import { ErrorView } from '@/components/ErrorView';
import { EvalSpinner } from '@/components/EvalSpinner';
import { mathMarkup } from '@/services/mathMarkup';
import { evalBlock } from './blockActions';
import { isResult } from './blockState';
import type {
  BlockState,
  BlockType,
  ErrorKind,
  MathSize,
  TextScale,
} from '@/types/block';

/**
 * React NodeView for a nibBlock. Renders the body by (blockType, blockState):
 * math editing → MathLive; evaluating → spinner; result → ResultView; error →
 * ErrorView; text/ink → ProseMirror content. Active state via EditorContext
 * (architect risk #2); placement is render-time clamp (design.md §3.1).
 */
export function NibBlockView(props: NodeViewProps) {
  const { node, editor, deleteNode, updateAttributes } = props;
  const { activeBlockId, setActiveBlockId, notifyClamped, onTipTrigger } =
    useEditorContext();

  const id = node.attrs.id as string;
  const lineIndex = node.attrs.lineIndex as number;
  const xOffset = node.attrs.xOffset as number;
  const blockType = node.attrs.blockType as BlockType;
  const blockState = node.attrs.blockState as BlockState;
  const latex = node.attrs.latexContent as string;
  const exactLatex = node.attrs.exactLatex as string;
  const approxLatex = node.attrs.approxLatex as string;
  const isApprox = node.attrs.isApprox as boolean;
  const errorKind = node.attrs.errorKind as ErrorKind;
  const textScale = node.attrs.textScale as TextScale;
  const mathSize = node.attrs.mathSize as MathSize;
  const color = node.attrs.color as string;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number>(0);

  const active = activeBlockId === id;
  const showEdge =
    active && blockType !== 'ink' && blockState !== 'ink-capture';

  // ---- Render-time clamp (never persisted) ----
  useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const recompute = () => {
      const host = el.offsetParent as HTMLElement | null;
      const usableW = host ? host.clientWidth : el.clientWidth;
      const blockW = el.offsetWidth;
      const left = clampRenderX(xOffset, blockW, usableW);
      el.style.left = `${left}px`;
      el.style.top = `${lineIndex * RULE_HEIGHT}px`;
      // Toast ONLY for a genuine right-overflow clamp — not the left-margin snap
      // nor the unmeasured first render (design.md §3.1).
      if (isClampedLeftward(xOffset, blockW, usableW)) notifyClamped();
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    const host = el.offsetParent;
    if (host) ro.observe(host);
    return () => ro.disconnect();
  }, [xOffset, lineIndex, blockState, latex, notifyClamped]);

  // ---- Math editing ----
  const handleMathChange = useCallback(
    (value: string) => {
      if (value.includes('sqrt')) onTipTrigger('sqrt-first');
      window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(
        () => updateAttributes({ latexContent: value }),
        50,
      );
    },
    [updateAttributes, onTipTrigger],
  );

  // ---- Tính: evalBlock flow — single shared path (NodeView + toolbar) ----
  const handleEval = useCallback(
    (value: string) => {
      // Persist latest latex first, then run the shared eval path.
      updateAttributes({ latexContent: value });
      void evalBlock(editor, id);
    },
    [editor, id, updateAttributes],
  );

  const handleEdit = useCallback(() => {
    updateAttributes({ blockState: 'editing-math' });
  }, [updateAttributes]);

  // ---- Empty-block auto-delete on blur ----
  const handleBlur = (e: FocusEvent<HTMLDivElement>) => {
    const next = e.relatedTarget as Node | null;
    if (next && wrapperRef.current?.contains(next)) return;
    const editingMath =
      blockState === 'editing-math' || blockState === 'empty';
    const empty =
      blockType === 'text'
        ? node.textContent.trim() === ''
        : editingMath && latex.trim() === '';
    if (empty) requestAnimationFrame(() => deleteNode());
  };

  // ---- Body by (blockType, blockState) ----
  let body: React.ReactNode;
  if (blockType === 'math') {
    if (blockState === 'evaluating') {
      body = (
        <div className="nib-math-row">
          <span
            className="nib-result__input"
            dangerouslySetInnerHTML={mathMarkup(latex)}
          />
          <span className="nib-result__eq" aria-hidden="true">
            =
          </span>
          <EvalSpinner />
        </div>
      );
    } else if (isResult(blockState)) {
      body = (
        <ResultView
          inputLatex={latex}
          exactLatex={exactLatex}
          approxLatex={approxLatex}
          isApprox={isApprox}
          onEdit={handleEdit}
        />
      );
    } else if (blockState === 'error') {
      body = (
        <div className="nib-math-row">
          <span
            className="nib-result__input"
            dangerouslySetInnerHTML={mathMarkup(latex)}
          />
          <ErrorView kind={errorKind} onFix={handleEdit} />
        </div>
      );
    } else {
      body = (
        <MathField
          value={latex}
          autoFocus
          onChange={handleMathChange}
          onEval={handleEval}
        />
      );
    }
  }

  const colorStyle = color
    ? ({ color: `var(--swatch-${color})` } as React.CSSProperties)
    : undefined;

  return (
    <NodeViewWrapper
      ref={wrapperRef}
      as="div"
      className="nib-block"
      data-block-id={id}
      data-block-type={blockType}
      data-block-state={blockState}
      data-math-size={mathSize}
      data-active={active}
      data-show-edge={showEdge}
      data-starter={node.attrs.starter ? 'true' : undefined}
      style={{ top: lineIndex * RULE_HEIGHT, left: xOffset }}
      onPointerDown={() => setActiveBlockId(id)}
      onFocusCapture={() => setActiveBlockId(id)}
      onBlurCapture={handleBlur}
    >
      <span className="nib-block__edge" aria-hidden="true" />
      <div className="nib-block__surface" style={colorStyle}>
        {blockType === 'math' ? (
          <>
            {body}
            {/* PM needs a contentDOM; math content lives in MathLive, so hide it */}
            <div className="nib-pm-hidden" aria-hidden="true">
              <NodeViewContent as="span" />
            </div>
          </>
        ) : (
          <NodeViewContent
            as="div"
            className="nib-block__content"
            data-text-scale={textScale}
          />
        )}
      </div>
    </NodeViewWrapper>
  );
}
