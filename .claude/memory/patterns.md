# Memory — patterns (cách làm đã thành công)

> Pattern đã pass: stack/cấu trúc + done-criteria khách quan đã đạt. Đọc trước khi thiết kế / chọn cách làm.
> LUÔN append (`## YYYY-MM-DD HH:MM — slug`), không overwrite. Dùng 10 entry mới nhất.

---

## 2026-06-11 12:30 — agent-team-setup-bootstrap

- Chưa có pattern app nào được ghi nhận (file khởi tạo trong Session 4.1).
- Khi một cách làm pass gate (vd vòng gõ→LaTeX→SymPy→render inline, hoặc MathLive block mount), append entry: stack/cấu trúc + done-criteria đã pass.

## 2026-06-12 14:00 — team-ops: SILENT/FORGOT-TASKUPDATE → kiểm `tools:` frontmatter TRƯỚC

- Issue: `planner` ghi xong deliverable nhưng không TaskUpdate/SendMessage (lặp ≥2 lần).
- **Root cause thật KHÔNG phải "quên" mà là KHÔNG THỂ**: `planner.md` (agent "tái dùng", predates team setup) thiếu `TaskGet/TaskUpdate/TaskList/SendMessage` trong `tools:` + thiếu hẳn section "Trong TeamCreate mode".
- **Pattern team-ops**: với code SILENT/FORGOT-TASKUPDATE → kiểm `tools:` frontmatter có đủ 4 tool team CHƯA trước khi siết prose. Vá brief/prose vô dụng nếu tool không có mặt. Đối chiếu agent body lỗi với 1 teammate "chuẩn" (vd researcher.md) để thấy thiếu gì.
- Fix: thêm 4 tool + copy section "Trong TeamCreate mode" (ack-on-spawn / TaskGet+TaskUpdate cùng turn / done=TaskUpdate+SendMessage cùng turn kể cả file deliverable / shutdown handler). Là agent body → báo lead diff, không cần user duyệt.

## 2026-06-12 17:50 — scaffold-theme-i18n-token-pattern (Session 1.1 PASS)

- Stack: Vite 5 + React 18 + TS strict (moduleResolution bundler, alias @→src) + @fontsource-variable/inter (bundle offline, Tauri-ready).
- Theme: anti-flash inline `<script>` trong `<head>` set `document.documentElement.dataset.theme` từ localStorage('nib-theme') TRƯỚC main.tsx → ThemeProvider Context {theme,resolved,setTheme,cycleTheme}, 3 mode light/dark/system, listen `prefers-color-scheme` khi 'system', persist. Chuyển KHÔNG reload/KHÔNG nháy.
- i18n: I18nProvider Context {lang,t,setLang,toggleLang}, import tĩnh en/vi json (switch runtime, không async flash), key phẳng namespace, `t(key,params?)` interpolate `{{param}}`, type `I18nKey = keyof typeof en` → typecheck chặn key sai. Default navigator.language fallback en, persist 'nib-lang'.
- Token: `src/styles/tokens.css` toàn bộ semantic token light+dark qua `[data-theme]`; component CHỈ dùng `var(--*)` (kể cả inline style `backgroundColor: var(--swatch-*)`).
- Done-criteria pass: `npm run build` 0 · `tsc --noEmit` 0 · grep 8 token bắt buộc đủ · grep hex rời ngoài tokens.css = rỗng · dev server HTTP 200.
- Gate hex rời: `grep -rnE '#[0-9a-fA-F]{3,8}' src/ --include=*.tsx --include=*.ts --include=*.css | grep -v tokens.css` kỳ vọng rỗng.

## 2026-06-13 00:55 — tiptap-free-placement-nodeview (Session 1.2 PASS)

- Stack: TipTap v2.27 (@tiptap/core+react+pm) free-placement block model.
- Doc schema flat: custom `NibDocument` (topNode, content 'nibBlock+', KHÔNG paragraph) + minimal inline `NibText` (Node name 'text', group inline) → tránh cài @tiptap/extension-text.
- `NibBlock` Node: attrs {id,lineIndex,xOffset,blockType,blockState,latex…}, draggable:false, selectable:false, ReactNodeViewRenderer(NibBlockView). Command `insertNibBlock` append cuối doc (vị trí visual = attrs nên doc-order vô nghĩa) + TextSelection.create vào node mới để focus.
- **Active-block = React state (EditorContext) TÁCH ProseMirror selection** (architect risk #2): NodeView onFocusCapture/onPointerDown → setActiveBlockId(id). Exactly 1 active.
- Placement: wrapper absolute, top=lineIndex*64 inline; left = clampRenderX(xOffset, blockW, usableW) trong useLayoutEffect + ResizeObserver — **clamp render-time KHÔNG persist** vào attrs. usableW = el.offsetParent(.nib-pm).clientWidth.
- Ruled paper: `repeating-linear-gradient(to bottom, var(--border) 0 1px, transparent 1px var(--ruled-line-height))`; absolute inset:0 pointer-events:none z0; .nib-pm relative z1; block z2. Partial-gap: surface inline-block chỉ cao bằng content+padding → ruling lộ phần dưới.
- Left-edge active line: `.nib-block[data-show-edge=true] .nib-block__edge {opacity:1}`; showEdge = active && blockType!=='ink' → INK-CAPTURE không có edge (design §4.3).
- Empty-blur delete: onBlurCapture, nếu relatedTarget ngoài block + node.textContent rỗng → requestAnimationFrame(deleteNode).
- **Test headless (vitest+jsdom)**: tạo `new Editor({extensions,content})` KHÔNG kèm EditorContent → ReactNodeViewRenderer KHÔNG mount NibBlockView (không cần provider, không throw) → test được schema + insertNibBlock attrs + ink-state + empty-detect. Polyfill ResizeObserver trong setup.ts.
- Done-criteria pass: `tsc --noEmit` 0 · `npm run build` 0 · `vitest run` 9/9 · grep 0 hex rời.

## 2026-06-13 01:20 — golden-path mathlive→mockCAS→result (Session 1.3 PASS)

- Vòng lõi: MathLive `<math-field>` (mount imperative, register qua mathliveSetup import TRƯỚC render trong main.tsx) → Shift+Enter onEval → `mockCAS.mockEval(latex)` (canned ≥10 + delay 300–800ms + error empty/parse/timeout/no_closed_form) → `resultToAttrs(res)` (pure, testable) → updateAttributes blockState → NibBlockView render theo state.
- Result render: MathLive STATIC `convertLatexToMarkup(latex)` qua dangerouslySetInnerHTML; **risk #3 spike: markup KHÔNG hardcode color → glyph inherit `color` container** → tint `color: var(--result)` exact / `var(--approx)` approx, KHÔNG cần --math-ink-color. Badge ≈ ngoài math-span (hit area 44px via ::before). Inline toggle chip exact↔decimal = local React state showExact, chỉ hiện khi có cả exact+approx.
- State machine: `blockState.ts` transition(state,event) pure + isResult(). Spinner EVALUATING debounce 150ms (setTimeout, không flash khi nhanh); reduced-motion → pulse dot CSS. ERROR state: ⚠️ SVG --error + message i18n (ERROR_KEY map ErrorKind→i18n key) + nút Sửa→editing-math.
- Convert toán↔chữ: command `convertNibBlock(id)` scan doc theo attrs.id → replaceWith node mới (math→text: latexContent thành schema.text; text→math: textContent thành latexContent). Trigger tạm Ctrl/Cmd+Shift+M (toolbar 1.4).
- Text marks B/I/U/S = Mark.create tối giản (strong/em/u/s) + addKeyboardShortcuts, tránh StarterKit. textScale block attr → CSS data-text-scale. Paste plain qua editorProps.handlePaste insertText.
- Math block: hidden NodeViewContent (`.nib-pm-hidden` clip) giữ PM contentDOM hợp lệ trong khi MathLive là editor thật; stopEvent target.closest('math-field') (risk #1).
- Done: `tsc` 0 · `build` 0 · `vitest` 27/27 · grep 0 hex.

## 2026-06-13 11:15 — ux-layers-toolbar-palette-pen-onboarding (Session 1.4 PASS — Phase 0 DONE)

- UX 4 lớp mock-UI hoàn chỉnh trong browser, tokens-only, i18n en/vi đầy đủ (76/76 key parity).
- FloatingToolbar: React `createPortal` lên body, vị trí từ `[data-block-id]` getBoundingClientRect (flip dưới nếu clip top), re-render qua `editor.on('transaction'/'selectionUpdate')`; route variant theo (blockType, blockState). `onMouseDown preventDefault` để không cướp focus block. Hit ≥44px.
- Shared action layer `blockActions.ts` (findBlock/patchBlock/evalBlock/deleteBlock) thao tác theo attrs.id qua setNodeMarkup — **một đường eval duy nhất** cho cả NodeView (Shift+Enter) lẫn toolbar (Tính/Tính lại). Tránh divergence.
- CommandPalette: Ctrl/Cmd+K portal modal, fuzzy = includes, keyboard nav ↑↓/Enter/Esc, list lệnh + kbd shortcut.
- `\` document-level SymbolMenu (chỉ khi !activeBlockId → MathLive tự xử `\` trong block); insert block/symbol seed latex.
- PenPalette UI-only: `usePointerType` (matchMedia fine/coarse + runtime pointerType pen); ẩn hoàn toàn `@media (hover:hover) and (pointer:fine)`; auto-collapse <900px qua matchMedia state → floating button.
- Onboarding: StarterContent = block seed result-exact (∫x²dx) attrs.starter, fade-out (add class `nib-block--fading` 250ms → deleteBlock) on first user block; GhostText khi doc rỗng (NibDocument content đổi 'nibBlock+'→'nibBlock*'); useContextualTips max 1/session qua sessionStorage flag, trigger 'sqrt' từ MathField onChange qua EditorContext.onTipTrigger.
- Icons: toàn bộ SVG currentColor (icons.tsx), 0 emoji (grep emoji-presentation rỗng); thay ✕/⚠️ glyph bằng SVG.
- Undo/redo: Extension wrap `@tiptap/pm/history` (history/undo/redo) — tránh StarterKit.
- Done: `tsc` 0 · `build` 0 · `vitest` 31/31 · grep 0 hex · 0 emoji · i18n 76/76.

## 2026-06-13 11:42 — hi-fi-redesign-katex-result (Task #8, folds #7)

- Chuyển STATIC math render từ MathLive `convertLatexToMarkup` sang **KaTeX** `katex.renderToString(latex,{throwOnError:false,output:'html'})` + `import 'katex/dist/katex.min.css'` ở main.tsx → fix bug số mũ/phân số (#7) + khớp mock (Computer Modern). GIỮ MathLive `<math-field>` cho INPUT. KaTeX glyph dùng currentColor → tint `color: var(--result/--approx)`. Vite bundle KaTeX woff2 (offline). Bỏ `mathlive/static.css` (không còn cần).
- Top chrome 54px khớp design-ref: logo nib (accent rounded 30px) + tên + sep + doc title (i18n app.doc_title) + spacer + undo/redo (editor.commands, lift editor vào TopChrome qua prop) + sep + VK + ⌘K chip (mở palette) + lang badge (accent-subtle) + theme toggle (IconSun/IconMoon theo resolved). Tách workspace: AppShell → Canvas(render TopChrome + stage).
- Ruled paper khớp mock: `repeating-linear-gradient(transparent 0 63px, var(--border) 63px 64px)` (line ở ĐÁY cell) → block align-items flex-end + padding-bottom 11px "ngồi" trên dòng. MARGIN_L=56 (gutter trái). Math 19px. Active block bg --accent-subtle radius 8 + left-edge 2px top/bottom inset 8.
- Toolbar/pen: button 34px (mouse) → 44px `@media (pointer:coarse)` để vừa khớp mock vừa giữ hit ≥44 nền. Toolbar radius 11 shadow-2; Tính pill accent; delete --error. Pen palette 52px radius 14, tool 40px, ink dots --ink.
- Done: `tsc` 0 · `build` 0 (KaTeX font + css bundled) · `vitest` 31/31 · grep 0 hex · 0 emoji · i18n 80/80 parity.

## 2026-06-14 20:15 — dock-v2-scaffold-static (Session 1.1 PASS)

- Stack: UnifiedDock 14-file tree (`src/components/UnifiedDock/`) dựng từ HTML ref (docs/Nib-Dock-v2-ref.html = source of truth, thắng mọi doc cũ). Session 1.1 = STATIC shell only (default state pen mode, flyouts open=false), state machine + interactivity để 1.2.
- Pattern tách file: leaf presentational components (DragHandle/ModeToggle/DockBtn/CalcBtn/FlyoutPanel + 6 *Flyout) + root UnifiedDock compose. Mỗi flyout nhận `open:boolean` prop → 1.2 chỉ cần wire state vào prop, không sửa cấu trúc.
- Icons HTML-exact: fill-based (dots/chevron/corner triangle) viết standalone `<svg fill="currentColor">` thay vì Base (Base ép stroke/fill=none). Per-line stroke-width (IconStrokeSize 1.2/2.6/4.2) cũng standalone. Exports KHÔNG bị noUnusedLocals (export = dùng).
- Token map HTML→app: `--sw-*`→`--swatch-*`, `--sh1/2`→`--shadow-1/2`, `--desk`→`--bg-app`. Pulse animation: thay rgba hardcode bằng `color-mix(in srgb, var(--accent) 30%, transparent)` → 0 hex/rgba rời (grep rỗng). 8 swatch tái dùng SWATCH_NAMES từ SwatchPicker.tsx, inline `style={{backgroundColor:'var(--swatch-'+name+')'}}`.
- Mount tạm song song: dock + FloatingToolbar + PenPalette cùng lúc (xóa cũ ở 2.1) → fallback an toàn. `.nib-stage{position:relative}` để dock absolute.
- noUnusedParameters: prop chưa dùng (editor ở 1.1) → destructure rename `{ editor: _editor }` (leading underscore exempt).
- Done: `tsc` 0 · `build` 0 · `vitest` 35/35 · grep hex+rgba dock = rỗng · i18n 31/31 en+vi parity 111=111 · dev HTTP 200.

## 2026-06-14 20:25 — dock-v2-state-machine (Session 1.2 PASS)

- Pattern: tách state machine ra module pure `dockState.ts` (mirror blockState.ts) → component CONSUME fn (toggleMode/togglePop/isFormatVisible/isEraserVisible/sizeTitleKey/parseMode/parseCollapsed) thay vì inline → unit-test được 7 case không cần DOM/RTL (repo KHÔNG có @testing-library/react). Đây là cách lấy evidence hành vi khi thiếu RTL.
- Crossfade collapse/expand: 2 lớp `position:absolute;top:0;right:0` overlap trong container relative; data-collapsed bật opacity/transform/pointer-events ngược nhau (.25s cubic) + container min-height 460↔56 (.3s). Tránh unmount → animate được cả 2 chiều.
- Flyout toggle: data-open trên panel → CSS opacity/transform translateX(9px) scale(.97)↔(0) .15s + pointer-events. Outside-close: useEffect document.pointerdown + dockRef.contains, GẮN listener chỉ khi openPop≠null (cleanup theo openPop dep) — đỡ listener thừa.
- Interactive flyout rows/swatch: đổi `<div>`→`<button>` cần reset CSS (border:none;background:transparent;width:100%;font:inherit;text-align:left; padding:0 cho swatch) để giữ nguyên visual.
- noUnusedParameters: prop editor chưa wire (1.2) giữ `{ editor: _editor }`. Re-export type từ module con: `export type { DockMode } from './dockState'` trong UnifiedDock để index.ts + flyout import được (flyout import thẳng dockState tránh cycle).
- prefers-reduced-motion: nhớ thêm CLASS mới (expanded/collapsed) vào block tắt transition.
- Done: `tsc` 0 · `build` 0 · `vitest` 42/42 · grep hex/rgba dock rỗng · dev HTTP 200.

## 2026-06-14 20:32 — dock-v2-wire-and-cleanup (Session 2.1 PASS — plan dock-v2 DONE)

- Wire dock→editor: UnifiedDock đọc activeBlockId từ useEditorContext() (dock nằm trong EditorContext.Provider của Canvas). Tính→evalBlock (reuse golden path đã test), Convert→editor.commands.convertNibBlock, Format B/I/U/S→editor.chain().focus().toggleMark + onMouseDown preventDefault (giữ focus block). Handler guard editor&&activeBlockId → no-op an toàn.
- Pen/size/color giữ local state (PenPalette cũ cũng UI-only Phase 0 → xóa không mất chức năng; EditorContext KHÔNG đổi theo PLAN §c để tránh breaking type).
- Cleanup: xóa FloatingToolbar.tsx/PenPalette.tsx/toolbar.css/pen.css + gỡ import. LƯU Ý gate "grep -rn FloatingToolbar|PenPalette src/ rỗng" bắt cả COMMENT — phải xóa cả comment nhắc tên file cũ, không chỉ import. SwatchPicker giữ (ColorFlyout tái dùng SWATCH_NAMES).
- Pattern xử lý mất chức năng khi thay UI: liệt kê inventory chức năng file cũ KHÔNG map sang UI mới → BÁO LEAD/user quyết trước khi xóa (đừng drop âm thầm). Ở đây user chốt (a) chấp nhận drop 6 mục (Copy/Delete/Duplicate + math-size/text-scale/block-color) → để Phase context-menu sau.
- Done: `tsc` 0 · `build` 0 · `vitest` 42/42 · grep refs cũ rỗng · grep hex/rgba dock rỗng · dev HTTP 200.

## 2026-06-15 11:10 — dock-v2-drag-reposition (Session 3.1 PASS)

- Drag-to-reposition cho floating dock: chuyển `position:absolute` (trong stage) → `createPortal(document.body)` + `.nib-dock-anchor{position:fixed; left/top từ pos state}`. Component VẪN là con React của Canvas → EditorContext/useEditorContext không vỡ (portal chỉ đổi DOM mount, không đổi React tree). Pattern chuẩn cho overlay cần thoát overflow clip + z-index.
- Pure positioning trong dockState.ts (testable không cần DOM): clampPos(x,y,vw,vh) giới hạn [0,vw-56]×[0,vh-56] + guard viewport nhỏ→0; parsePos(raw,vw) JSON guard finite number → fallback defaultPos; defaultPos(vw)=góc phải-trên. +5 unit test.
- Pointer drag: setPointerCapture(e.pointerId) trên handle; dragOrigin ref {px,py,x,y} + dragMoved ref (max Manhattan delta). onMove: setPos(clampPos(origin + delta)). Tap-vs-drag cho ô collapsed: delta<4px = tap→expand, else drag. Bỏ onClick→thay pointer handlers + onKeyDown Enter/Space giữ a11y.
- Persist khi settle: useEffect ghi localStorage khi !isDragging (sau thả + sau resize re-clamp), KHÔNG ghi giữa drag. window.resize → setPos(clampPos) re-clamp vào viewport.
- CSS: `touch-action:none` trên vùng kéo (handle + collapsed) chặn scroll/gesture nuốt pointer; `[data-dragging] * {transition:none!important; user-select:none}` cho kéo mượt không lag.
- Done: `tsc` 0 · `build` 0 · `vitest` 47/47 · grep hex/rgba dock rỗng · dev HTTP 200.

## 2026-06-15 11:22 — dock-v2-overflow-aware-expand-flyout (Session 3.2 PASS — plan dock-v2 DONE)

- Overflow-aware expand direction: state expandDir; doExpand() chọn 'up'/'down' theo spaceBelow=innerHeight-pos.y so với DOCK_EXPANDED_H(460) TRƯỚC animation (không 2 animation nối tiếp). CSS `.nib-dock__expanded[data-expand-up]{top:auto;bottom:0}` → mở lên từ đáy anchor. posRef mirror pos để doExpand callback stable ([] deps) mà vẫn đọc pos mới.
- Flyout flip overflow-aware: bỏ top hardcode CSS → tính JS tại tog(k) bằng getBoundingClientRect (btnRefs[k] + expandedRef): fit dưới viewport(-8px) → top=topRel; else lật lên top=topRel+btnH-flyoutH (clamp≥0). setFlyoutStyle{[k]:{top}} → style prop xuống FlyoutPanel spread (override CSS top:0 fallback). btnRefs = useRef<Partial<Record<PopKey,HTMLButtonElement|null>>>, DockBtn nhận btnRef callback ref.
- Pure helpers tách dockState.ts (testable không DOM): expandDirection(posY,vh), flyoutTop(topRel,expTop,btnH,flyoutH,vh) + FLYOUT_HEIGHTS const. +3 test (down/up + fit/flip/clamp). Pattern: mọi math layout → pure fn + unit test, component chỉ đo DOM + gọi.
- Đo DOM tại thời điểm tương tác (tog/doExpand) thay vì useLayoutEffect: đơn giản, đúng vì dock đã mount sẵn (chỉ đổi openPop), ref luôn current.
- Done: `tsc` 0 · `build` 0 · `vitest` 50/50 · grep hex/rgba dock rỗng · grep top hardcode flyout rỗng · dev HTTP 200. Plan dock-v2 (Phase 1+2+3) HOÀN THÀNH.

## 2026-06-17 17:05 — paper-offsetparent-position-static (S1.3)

Stack: React + TipTap NodeView absolute placement trên paper cố định 664px.
Pattern: block đặt `top = lineIndex * RULE_HEIGHT` (NibBlockView inline + layout-effect). Để offsetParent của .nib-block = .nib-pm (664px) chứ KHÔNG phải desk viewport-wide:
  - `.nib-desk { position: static }` EXPLICIT (RISK#2 — desk positioned → block tràn).
  - `.nib-editor-host { position: relative; min-height: calc(var(--ruled-line-height)*16) }` (RISK#1 — thiếu min-height → host collapse 0 → block stack mất vùng click/scroll).
  - `.nib-pm { position: relative; min-height: inherit }`.
Coords paper-relative: `paperRef.current.getBoundingClientRect()` (KHÔNG dùng desk).
Done: tsc 0 · build 0 · vitest 53/53 · test RISK#1 lineIndex=3→192px · geometry.ts diff=0.

## 2026-06-17 21:40 — library-overlay-data-attr-open (S1.5)

Stack: React overlay (scrim+panel) trên app shell, state-lifted ở AppShell.
Pattern: overlay open/close = `data-open` attr trên wrapper (.nib-library-overlay) → CSS opacity+pointer-events transition, KHÔNG conditional unmount (giữ animation). Panel `transform: translateY(8px)`→`none` khi open: tại rest transform=none nên position:fixed con (context menu tại clientX/Y) resolve theo VIEWPORT (transform!=none tạo containing-block phá fixed → chỉ né bằng cách settle về none).
Sub-popover (sort/ctx/delete) conditional-render OK; click-away = `.nib-lib-popover-backdrop` position:fixed inset0 z69, menu z70.
Danger button: bg `var(--error)` + text `var(--text-on-accent)` (KHÔNG raw #fff — R4; --text-on-accent flips light/dark cho contrast tốt hơn #fff trên error-dark).
Done: tsc 0 · build 0 · vitest 53/53 · 0 hex rời · z-index 50/60/70/80 phân tầng.

## 2026-06-17 22:10 — team-ops: ghi-lại-issues.md là ĐIỀU KIỆN DONE (không phải bước cuối tuỳ chọn)

- Lỗi cơ chế của chính team-ops (user chỉ ra): fix code `.claude/` xong nhưng KHÔNG quay lại đóng `issues.md` (status vẫn `open`, target không ghi đã fix GÌ) → queue mất sync, không ai biết đã fix & fix ra sao.
- **Pattern**: đóng issue NGAY sau Edit, TRƯỚC khi SendMessage báo lead — không để cuối (dễ rớt). `target` phải ghi RÕ **file đã sửa + HOW + ngày `(team-ops, YYYY-MM-DD)`**. Queue chưa cập nhật = CHƯA done dù code đã sửa.
- Đã siết vào `team-ops.md` (mục "Khi xong" bước (a) bắt buộc trước TaskUpdate/SendMessage + "Cách làm" bước 6 "ghi NGAY không để cuối" + gate-table + anti-pattern) và `team-fix/SKILL.md` (§0.5 + §4.5). Agent body/skill → không high-impact.
- Ngưỡng §3 áp trong cùng session này: ISSUE-3+5 (lead bỏ qua plan, lặp ≥2) → cứng hoá PLAN-GATE vào master §3/§4 + playbook §1; ISSUE-6 → đổi guard layout từ đọc `teammateMode` sang kiểm `$TMUX` runtime (đính chính kết luận no-op sai của ISSUE-2). High-impact (master/playbook) → áp theo lệnh trực tiếp user.

## 2026-06-18 15:15 — drill-down dock level (nav-dock S1.1)

- **Bài toán**: 1 dock duy nhất (`UnifiedDock`) cần 2 cấp NAV↔TOOLS thay vì ModeToggle. Giữ collapse/drag/flyout-overflow đã có.
- **Pattern dùng (pass build/tsc/vitest):**
  - State `dockLevel:'nav'|'tools'` **in-memory** (`useState`, default 'nav', KHÔNG persist) — startup luôn về NAV cho dễ định hướng; né thêm localStorage key + parse/clamp. Pure helpers testable: `navSelect(btn)→{mode,level}`, `backToNav()→'nav'` trong dockState.ts (test thuần, không cần DOM).
  - Render drill-down: wrapper `<div className="nib-dock__level" data-level={level} key={level}>` — **key remount** kích hoạt CSS `@keyframes` fade-in 0.15s (đơn giản hơn slide/đo-đạc, 1 subtree mount tại 1 thời điểm). reduced-motion guard tắt animation.
  - Nút collapse đặt **NGOÀI** level wrapper → collapse được ở mọi level, bung về level đang đứng (collapse/expand state độc lập với level).
  - Tách `NavLevel.tsx` riêng (pattern component-per-concern: DockBtn/CalcBtn). UnifiedDock giữ state, truyền props. AccountChip = placeholder inline (avatar `--accent-subtle`+initials `--accent`).
- **Xóa component có vitest an toàn**: grep ref TRƯỚC — ModeToggle chỉ ở UnifiedDock+file của nó, KHÔNG test nào chạm component (test chỉ chạm pure fn `toggleMode` ở dockState — giữ lại). → xóa file + import + render + callback, 0 test fail.
- **Hit target [LOCKED] ≥44px**: redesign mới KHÔNG có "HTML-wins" exception → bump `.nib-dock__btn` 40→44px ngay từ CSS. Đừng kế thừa mốc 40px của dock-v2 (đó là ngoại lệ HTML-thắng riêng).
- Type cho prop `t`: `I18nContextValue['t']` (không có `TFunction` export trong useI18n) — import từ `@/providers/i18n-context`.
- Confirm: tsc 0 · vitest 56/56 · build 0 (2.06s) · grep hex UnifiedDock = 0 · i18n parity 7/7.

## 2026-06-18 15:25 — topstrip-replace-topchrome-pattern

Stack: React/TS — thay header đầy đủ bằng strip mỏng + bỏ sidebar (nav-dock-redesign S1.2).
Pattern: component mới `TopStrip.tsx` (doc-title switcher dropdown + inline-rename + theme/undo/redo), Workspace swap `<TopChrome>`→`<TopStrip>` + bỏ `<SidebarRail>`, GIỮ UnifiedDock+CommandPalette trong EditorContext.Provider (không di chuyển Provider). undo/redo nối `editor.commands.undo()/redo()`; rename persist qua handler AppShell (`handleCommitRename`) truyền xuống prop. Xóa file = xóa import cùng turn (0 dangling).
Dropdown switcher anchored top-left (top:calc(100%+6px);left:0) + max-height 60vh scroll → không overflow viewport, không cần đo getBoundingClientRect (khác context-menu theo con trỏ).
Done-criteria pass: tsc 0 · vitest 56/56 · build 0 (2.16s) · 0 hex rời src/components · strip.* parity en5/vi5 · hit target 44px.

## 2026-06-18 16:12 — settings-overlay-mirror-library + dock-nav-wiring

Stack: React/TS — overlay MVP + wire dock NAV vào app-level state (nav-dock-redesign S1.3, plan HOÀN THÀNH 3/3).
Pattern: `SettingsOverlay/` mirror `LibraryOverlay/` (scrim+panel, data-open no-unmount, reduced-motion). Lang/Theme seg dùng useI18n.setLang + useTheme.setTheme → runtime + persist sẵn trong provider (nib-lang/nib-theme), KHÔNG cần thêm cơ chế lưu. Overlay state ở AppShell (top-level như LibraryOverlay), mở từ dock = thêm prop callback bubble: AppShell→Workspace→UnifiedDock→NavLevel onSettings/onLibrary (hết no-op placeholder). AccountChip đọc localStorage nib-user-name fallback "User".
Quyết định: dock dọc hẹp → AccountChip avatar-only (tên qua title/aria), không render name label (ép dock rộng).
Done-criteria pass: tsc 0 · vitest 56/56 · build 0 (2.02s) · §9 15/15 en+vi · parity 147/147 · 0 hex rời src/components.

## 2026-06-19 16:25 — settings-overlay-layout-neutral-3-variants

Stack: React/TS — SettingsOverlay sidebar-nav + ProfileProvider (settings-redesign S2).
Pattern layout-neutral: component tree CỐ ĐỊNH (SettingsNav + SettingsContent, HTML không hardcode width/position) → 3 hướng nav (rail/tabs/grid) = thuần CSS qua `[data-settings-layout=rail|tabs|grid]` trên `.nib-settings__panel`. Dev switch tạm persist localStorage `nib-settings-layout` → user bấm đổi LIVE chọn 1 hướng, task sau khoá.
Section registry: `SectionDef[]` (id/i18nKey:I18nKey/icon/component/comingSoon?) eager — thêm section = append 1 entry, shell không sửa. activeId trong INTERNAL SettingsContext (không export khỏi index.ts) → props chỉ {open,onClose} (tránh 18-prop LibraryOverlay).
ProfileProvider: wrap NGOÀI ThemeProvider ở App.tsx (dock/TopStrip sau dùng useProfile). StoredProfile persist `nib-profile`, avatarInitials derive tại render (không persist), avatarColor = deriveAvatarColor(name) stable hash %8 → named swatch token (`--swatch-teal..slate`, KHÔNG `--swatch-1..8`). Avatar dùng color-mix(swatch 16%, surface) tránh hex rời.
R1 confirm: thêm TẤT CẢ i18n key settings.* (en+vi) TRƯỚC khi tạo registry — I18nKey=keyof typeof en check compile-time, sai thứ tự → tsc fail.
Done: tsc 0 · build 0 · vitest 62/62 (+6 profile: deriveInitials ''→'?'/'Hung'→'H'/'Nguyen Hai'→'NH', deriveAvatarColor stable) · 0 hex rời · settings.* parity en=vi=19.
