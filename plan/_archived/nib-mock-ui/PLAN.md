# PLAN — Nib Mock-UI shell (Phase 0)

> Sau khi xong Phase 0, bản mock Nib chạy được trong browser (Vite dev) với UI/UX đầy đủ theo `docs/design.md` — tương tác gõ công thức → nút Tính → kết quả symbolic render inline — sử dụng mock CAS stub frontend, KHÔNG cần backend thật hay MyScript license.

---

## Context

- **Vì sao chia nhiều session**: Phase 0 gồm design system (tokens/theme/i18n), canvas block model, math/text block + mock CAS pipeline, UX 4 lớp + onboarding — tổng > 20 file touch, vượt 1 chat capacity.
- **Phụ thuộc bắt buộc**: output architect Task #1 (HOW design — component tree, mock CAS API contract, file structure `src/`) là **input bắt buộc cho mọi session implement**. Implementer đọc architect output trước khi bắt đầu Session 1.1. Nếu architect chưa xong → chờ, không tự quyết HOW.
- **Ràng buộc**:
  - Mock-only: CAS = frontend stub (`src/services/mockCas.ts`). KHÔNG backend thật. KHÔNG MyScript thật (HUMAN GATE §11.2 vẫn treo). Bút Phase 0 = pen palette UI-only, không ink capture.
  - CC-6 (TipTap vs Lexical) phải chốt trước Session 1.2 (NodeView block model).
  - Mọi màu đi qua design token (cấm hex rời). Mọi chuỗi UI đi qua `t()` i18n (cấm hardcode text). Min-width CSS = 820px (sub-compact, `design.md` §2.2).
  - 3 yêu cầu nền bắt buộc mọi component: song ngữ en/vi · desktop-class 820px+ · theme + design tokens (`docs/requirements.md`).
- **Workstream liên quan**: Phase 0 theo `plan/ROADMAP.md`. Gate vàng = vòng "gõ 1 block → Tính → kết quả mock symbolic inline" chạy live end-to-end.
- **Out of scope Phase 0**: Backend FastAPI thật · Tauri IPC thật · MyScript HTR thật · Ink capture / bút thật · Export PDF/PNG · Cross-block selection · AI layer · Post-MVP features (`feature.md` §7.5.5).

---

## Pipeline 1 phase / 4 session

```
[Session 1.1] Scaffold + design system ──────────────► tokens.css + theme + i18n chạy
                                                             │
[Session 1.2] Canvas + block placement ──────────────────── ► ruled paper + NodeView + active-block
                                                             │
[Session 1.3] Math/Text block + Mock CAS + State machine ──► vòng gõ→Tính→kết quả mock inline
                                                             │
[Session 1.4] UX 4 lớp + Pen palette + Onboarding ────────► mock-UI hoàn chỉnh trong browser
```

---

## Phase 0 — Mock-UI shell

**Mục tiêu**: Build bản mock Nib chạy được trong Vite dev browser, UI/UX đầy đủ theo spec (`docs/feature.md` + `docs/design.md`), mock CAS stub frontend, không backend thật.

---

### Session 1.1 — Scaffold + design system

- **Scope**:
  - Khởi tạo Vite + React/TS project (theo HOW architect): `vite.config.ts`, `tsconfig.json` strict, ESLint, Tauri-ready structure (phân tách `src/` và `src-tauri/` placeholder).
  - `src/styles/tokens.css`: **đầy đủ** toàn bộ token từ:
    - `requirements.md §3`: màu light + dark (tất cả token `--bg-*`, `--text-*`, `--border*`, `--accent*`, `--ink`, `--result*`, `--approx*`, `--success/warning/error/info`, `--radius-*`, `--shadow-*`, `--caret`). `--approx` light = `#7A5200` (`design.md §10.2` [USER CHỐT]).
    - `design.md §6.2`: typography tokens (`--font-size-ui-xs/sm/md`, `--font-size-doc-heading/body/small`, `--font-math-inline/display`).
    - `design.md §6.3`: spacing tokens (`--space-1..8`, `--ruled-line-height: 64px`).
    - `design.md §8.2`: swatch 8 màu (`--swatch-teal/blue/green/red/purple/rose/orange/slate`, light + dark).
  - Font Inter (variable) bundle: `@font-face` trong tokens.css hoặc import vào global CSS.
  - Theme system: `data-theme` attr trên `<html>`, 3 chế độ `light/dark/system` (mặc định `system`, bám `prefers-color-scheme`). Chuyển theme không reload, không nháy trắng (set `data-theme` trước first paint). Persistent lưu `localStorage` key `nib-theme`.
  - i18n provider: `src/locales/en.json` + `src/locales/vi.json` (key namespace phẳng, vd `editor.block.add`). Hook `t(key, params?)` + `useI18n()`. Switch runtime không reload. Ngôn ngữ mặc định theo `navigator.language`, fallback `en`. Persistent lưu `localStorage` key `nib-lang`.
  - App shell: `src/main.tsx` + `src/App.tsx`, `data-theme` set trước first paint (tránh nháy).
  - Khởi tạo `src/locales/en.json` + `vi.json` với ≥10 key đầu (bao gồm: `editor.block.add`, `editor.no_active_block_tip`, `editor.calc_tooltip`, `editor.empty_hint`, `app.small_screen_notice`, `app.blocks_clamped_notice`, `result.toggle_exact`, `result.toggle_decimal`, `result.approx_tooltip`, `error.parse`, `error.timeout`, `error.no_closed_form`).

- **STOP gate**:
  - `npm run build` exit 0.
  - `tsc --noEmit` 0 error.
  - Theme switch: `document.documentElement.dataset.theme` đổi đúng (light/dark), màu nền `--bg-app` thay đổi quan sát được trong browser — không reload, không nháy trắng (quan sát visual trong Vite dev).
  - `t('editor.calc_tooltip')` trả chuỗi en và vi đúng theo runtime lang (log console hoặc render ra DOM để kiểm).
  - `grep` trong `tokens.css`: có đủ `--accent`, `--result`, `--approx`, `--ink`, `--ruled-line-height`, `--space-8`, `--swatch-teal`, `--font-size-doc-body` → tất cả tồn tại (0 miss).

- **Output artifact**: `src/styles/tokens.css`, `src/locales/en.json`, `src/locales/vi.json`, `src/hooks/useTheme.ts`, `src/hooks/useI18n.ts`, `src/main.tsx`, `src/App.tsx`, `vite.config.ts`, `tsconfig.json`.

---

### Session 1.2 — Canvas + block placement model

> **Blocker**: CC-6 (TipTap vs Lexical) phải chốt trước session này. Đọc architect HOW output trước khi implement NodeView.

- **Scope**:
  - Ruled-paper canvas container: CSS `repeating-linear-gradient` (`--ruled-line-height` 64px, stroke `1px solid var(--border)`), nền `--bg-app`. Canvas max-width 1440px centered. 4 CSS breakpoints: sub-compact 820–1023px / compact 1024–1279px / regular 1280–1679px / wide ≥1680px. Dưới 820px → notice `app.small_screen_notice` (i18n) thay vì co layout.
  - Free-placement block model: editor framework (TipTap/Lexical per CC-6) NodeView. Mỗi block có attrs `lineIndex` (int) + `xOffset` (px int). CSS `position: absolute; top: lineIndex × 64px; left: renderX`. Clamp render-time: `renderX = clamp(xOffset, marginL, canvasUsableWidth − blockWidth − marginR)` — **KHÔNG persist** clamp vào attrs. Toast `app.blocks_clamped_notice` khi clamp thực sự dời block (1 lần per document open).
  - Click/tap chỗ trống trên canvas → tạo block mới tại `(lineIndex, xOffset)` tương ứng vị trí pointer. Tính `lineIndex = floor(pointerY / 64)`, `xOffset = pointerX − canvasLeft − marginL`.
  - Active-block (exactly 1 at a time):
    - Hover (pointer:fine): `--accent-subtle` bg fade in.
    - EDITING-MATH / EDITING-TEXT: `--accent-subtle` bg + left-edge line 2px `--accent`, height = 100% bounding-box block, inset 8px từ lề trang (`--space-2`), fade `opacity 0→1` 100ms (instant nếu `prefers-reduced-motion: reduce`). Line-cap flat.
    - INK-CAPTURE: chỉ `--accent-subtle` bg — **không** left-edge line (tránh cạnh tranh màu teal ink↔accent).
    - Không active → nút Tính + floating toolbar ẩn. `Shift+Enter` → tooltip i18n `editor.no_active_block_tip`.
  - Partial-ruling gap: block background `--bg-surface` phủ `contentHeight + 8px`, không phủ kín N×64px — ruling lines vẫn hiện phần còn lại.
  - Empty block tự xóa khi blur (không có nội dung + mất focus → remove node).
  - Nhiều block trên cùng lineIndex: collision snap/nudge sang khoảng trống (HOW cụ thể theo architect — chỉ implement nếu architect đã chốt).

- **STOP gate**:
  - `npm run build` exit 0.
  - `tsc --noEmit` 0 error.
  - Click chỗ trống trên canvas → block tạo đúng vị trí: CSS `top` = `lineIndex × 64px`, `left` = `xOffset` (quan sát DevTools computed style), console 0 error.
  - Active block: click block → left-edge 2px `--accent` hiện (`border-left` hoặc `::before` 2px computed style đúng màu `--accent`) + nền `--accent-subtle` hiện.
  - Blur block rỗng → block DOM node bị remove (MutationObserver hoặc quan sát DOM trong DevTools).
  - Canvas ruler: `background` CSS có `repeating-linear-gradient` 64px (kiểm DevTools Computed → background).
  - Viewport 834px: sub-compact layout không vỡ (resize Chrome devtools → "iPad Pro 11" portrait").

- **Output artifact**: `src/components/Canvas.tsx`, `src/components/Block.tsx` (base NodeView), `src/hooks/useBlockPlacement.ts`, `src/styles/canvas.css` (breakpoints).

---

### Session 1.3 — Math block + Text block + Mock CAS + State machine + Result render

- **Scope**:
  - **Math block** (loại mặc định khi tạo block): MathLive `<math-field>` WYSIWYG. Live render khi gõ (x^2→x², `\int`→∫, `sqrt`→√, `\sum`→Σ, `\frac`→phân số…). **KHÔNG gọi CAS khi gõ.** Output LaTeX qua `mathfield.getValue('latex')`. Màu input: `--text-primary`. Caret: `--caret`.
  - **Text block**: contenteditable hoặc editor framework text node. Hỗ trợ B/I/U/S + 3 bậc cỡ (Heading/Body/Small theo `--font-size-doc-*`). Màu `--text-primary`. Copy/paste plain (`Ctrl+V` và `Ctrl+Shift+V` đều plain).
  - **Nút Convert** (đổi loại block toán↔chữ):
    - Có bôi đen: chuyển đúng đoạn đó.
    - Không bôi đen: lật chế độ nhập tiếp theo.
    - Toán→Chữ: ký tự MathLive thành text thường.
    - Chữ→Toán: parse text vào MathLive live render.
  - **Mock CAS stub** `src/services/mockCas.ts`: function `evalLatex(latex: string, context: Record<string, string>): Promise<EvalResult>`. Fixture ≥10 ca:
    - `\frac{d}{dx}x^2` → `{exact_latex: "2x", is_approx: false}`
    - `\int x\,dx` → `{exact_latex: "\\frac{x^2}{2}+C", is_approx: false}`
    - `2/3+1/4` → `{exact_latex: "\\frac{11}{12}", is_approx: false}`
    - `\sin\pi` → `{exact_latex: "0", is_approx: false}`
    - `\sqrt{8}` → `{exact_latex: "2\\sqrt{2}", is_approx: false}`
    - `x^2+2x+1` → `{exact_latex: "(x+1)^2", is_approx: false}`
    - `\sum_{i=1}^{n}i` → `{exact_latex: "\\frac{n(n+1)}{2}", is_approx: false}`
    - `\lim_{x\to 0}\frac{\sin x}{x}` → `{exact_latex: "1", is_approx: false}`
    - `\int_0^1 e^{x^2}\,dx` → `{exact_latex: "", approx_latex: "1.4627", is_approx: true}` (approx-only)
    - `3!` → `{exact_latex: "6", approx_latex: "6", is_approx: false}`
    - `???` (parse fail) → `{error: "parse", exact_latex: "", is_approx: false}`
    - (Thêm ≥1 ca `error: "timeout"` để test timeout state)
    Delay ~300ms để simulate latency.
  - **Nút Tính**: phím tắt `Shift+Enter` hoặc floating toolbar [Tính]. Phạm vi = vùng bôi đen hoặc block active (theo `design.md` §4.2). Gọi `evalLatex()`.
  - **State machine** (`feature.md` §5): EDITING-MATH / EDITING-TEXT / INK-CAPTURE (stub, không ink thật) / EVALUATING / RESULT-EXACT / RESULT-APPROX / ERROR / EMPTY.
  - **Spinner EVALUATING** (`design.md` §5.3): inline tại vị trí `=`, 16px `--accent`, debounce 150ms (không flash khi nhanh). `prefers-reduced-motion` → pulse dot thay rotation.
  - **Render kết quả** (`design.md` §7, `feature.md` §6): Liền mạch, không khung, không viền. Kết quả ngắn → cùng dòng sau `=`. Kết quả dài → xuống dòng kẻ kế. Dùng **MathLive static `<math-span>`** để render LaTeX kết quả. Màu: `--result` (exact indigo), `--approx` (approx amber).
  - **Badge ≈** (`design.md` §7.3): khi `is_approx: true`. Pill `--approx-subtle` nền, `≈` màu `--approx` 13px w700, hit area 44×44px via CSS `::before`, ngoài `<math-span>`. `aria-label="Approximate"`. Tooltip i18n `result.approx_tooltip`.
  - **Inline toggle chip exact↔decimal** (`design.md` §7.4): 2 chip `= Exact` / `≈ Decimal` (i18n `result.toggle_exact`/`result.toggle_decimal`). Hiện NGAY (không đợi refocus toolbar). Chỉ hiện khi cả 2 giá trị có. Active chip: `--accent-subtle` bg + `--accent` text + border 0.3α. Inactive: transparent + `--text-muted`.
  - **ERROR state** (`design.md` §5.2): 3 loại — parse / htr / timeout / no_closed_form. Icon ⚠️ SVG màu `--error` + message i18n (en+vi) + nút "Sửa" (i18n `editor.error_fix_cta`) → focus EDITING-MATH.
  - **Focus/blur kiểu Typora**: RESULT-RENDERED → click/tap lại → EDITING-MATH (kết quả thu lại, MathLive open). Không bao giờ hiển thị raw LaTeX với user không chủ động.

- **STOP gate**:
  - `npm run build` exit 0.
  - `tsc --noEmit` 0 error.
  - Gõ `x^2` trong math block → live render x² (MathLive WYSIWYG, quan sát visual trực tiếp), console 0 error.
  - Nhấn Tính với mock fixture `\frac{d}{dx}x^2` → spinner 150ms debounce → render kết quả `2x` màu `--result` (indigo) inline (console 0 error).
  - Mock fixture `is_approx: true` → badge ≈ hiện đúng màu `--approx` (amber) + 2 chip toggle `= Exact` / `≈ Decimal` hiện (quan sát DOM).
  - Mock fixture `error: "parse"` → ERROR state hiện message i18n (test cả en và vi bằng switch lang).
  - Convert toán→chữ: math block MathLive tắt, nội dung thành text thường — console 0 error.
  - `mockCas.ts`: `evalLatex` trả đúng fixture theo LaTeX key (unit test hoặc console log 10 ca).

- **Output artifact**: `src/components/MathBlock.tsx`, `src/components/TextBlock.tsx`, `src/services/mockCas.ts`, `src/types/eval.ts` (EvalResult type), `src/hooks/useBlockState.ts`, `src/components/ResultView.tsx`, `src/components/BadgeApprox.tsx`, `src/components/ToggleChip.tsx`, `src/components/EvalSpinner.tsx`.

---

### Session 1.4 — UX 4 lớp + Pen palette + Onboarding

- **Scope**:
  - **Floating toolbar `§7 Lớp 2`** (`design.md` §4.4): nổi khi block active, content theo loại + state. Icon SVG (Phosphor/Lucide, không emoji). Hit target ≥44px. Toolbar-lift khi virtual keyboard che.
    - EDITING-MATH: **[Tính]** (primary, `--accent`, icon `= →`, tooltip `editor.calc_tooltip`) + [Convert → Chữ] (icon `↔T`) + cỡ (normal/display) + Copy LaTeX + Xóa.
    - EDITING-TEXT: B/I/U/S + 3 bậc cỡ (Heading/Body/Small) + [Convert → Toán] + Xóa.
    - RESULT-EXACT/APPROX: toggle exact↔decimal (chip như §7.4) + [Tính lại] + Copy LaTeX kết quả + Xóa.
    - Không active → toolbar ẩn hoàn toàn.
  - **`\` symbol panel `§7 Lớp 1`**:
    - Trong MathLive block: MathLive tích hợp autocomplete LaTeX khi gõ `\`.
    - Document level (ngoài block): gõ `\` → dropdown menu chèn block mới / ký hiệu. Label qua i18n.
  - **Command palette `Ctrl/Cmd+K` `§7 Lớp 3`**: modal full-screen blur backdrop, input fuzzy search, danh sách lệnh (Tính, Convert, Switch lang, Switch theme, Xóa block…) + shortcut. Keyboard navigation (↑↓, Enter, Escape).
  - **Pen palette UI-only** (`design.md` §2.3, `feature.md` §7.5.4):
    - Dải dọc fixed bên phải canvas.
    - **Ẩn hoàn toàn** khi `@media (hover: hover) and (pointer: fine)` (chuột).
    - Hiện khi `pointer:pen` hoặc `pointer:coarse` (cảm ứng/bút).
    - sub-compact < 900px → collapse thành floating button (44px icon).
    - Tools: pen (fountain nib icon) / highlighter / stroke-eraser / lasso. 3 cỡ nét. Swatch 8 màu (`--swatch-*`). UI-only — không có ink thật Phase 0.
  - **Contextual tips `§7 Lớp 4`** (`design.md` §4.5): max 1 tip/session (dùng thường), dismissible. Triggers: gõ `sqrt` lần đầu / nhập xong không nhấn Tính sau 30s / block đầu tiên có kết quả approx (amber) / bôi đen lần đầu trước Tính. Lưu `localStorage` per-session flag.
  - **Onboarding** (`design.md` §4.5): 
    - Starter content: tài liệu mới mở → 1 block demo Math có kết quả (vd `∫ x² dx` với kết quả `x³/3 + C`). User tạo block đầu tiên → starter content fade-out (CSS transition opacity 0, sau đó remove). Không tính quota tip.
    - Ghost text: dòng kẻ trống đầu khi tài liệu hoàn toàn rỗng → text mờ `editor.empty_hint` (i18n). Fade out khi block đầu tiên tạo.
  - **Icon set đầy đủ** (`design.md` §9.2): SVG, không emoji. Tính (`= →`), Convert (`↔T`), Pen nib (fountain), Highlighter (marker nghiêng), Stroke-eraser (tẩy + gạch), Lasso (đường đứt lượn), Virtual KB (bàn phím mini), Toggle exact/approx (`= ↔ ≈`).
  - **Virtual keyboard toggle**: nút ≥44px, label i18n. MathLive virtual keyboard ẩn mặc định trên desktop, hiện khi toggle hoặc tự hiện khi touch device.

- **STOP gate**:
  - `npm run build` exit 0.
  - `tsc --noEmit` 0 error.
  - Toolbar EDITING-MATH: nút [Tính] màu `--accent` hiện, nút [Convert → Chữ] hiện (quan sát DOM + style). Toolbar EDITING-TEXT: B/I/U/S hiện, [Convert → Toán] hiện. Toolbar RESULT-*: toggle chip + [Tính lại] hiện. Toolbar ẩn khi không có active block.
  - `Ctrl+K` → command palette modal mở, input focus (quan sát `document.activeElement`).
  - Gõ `\` ở document level (ngoài block) → symbol/block menu dropdown hiện.
  - Pen palette: `@media (hover:hover) and (pointer:fine)` → ẩn hoàn toàn (`display:none` hoặc `visibility:hidden`). Chrome DevTools "Emulate touch" (pointer:coarse) → pen palette hiện (quan sát DOM).
  - Starter content: tài liệu mới → 1 block demo hiện. Tạo block đầu tiên → starter content fade-out (CSS `opacity: 0` transition rồi remove node).
  - Contextual tip: gõ `sqrt` → tip hiện đúng 1 lần trong session, dismissible.

- **Output artifact**: `src/components/FloatingToolbar.tsx`, `src/components/CommandPalette.tsx`, `src/components/SymbolPanel.tsx`, `src/components/PenPalette.tsx`, `src/components/StarterContent.tsx`, `src/components/GhostText.tsx`, `src/hooks/useContextualTips.ts`, `src/assets/icons/` (SVG set: calc, convert, pen, highlight, eraser, lasso, keyboard, toggle).

---

## Phase 0 gate (sau Session 1.4 pass — toàn bộ Phase 0 done)

- `npm run build` exit 0.
- `tsc --noEmit` 0 error.
- **Vòng lõi end-to-end** trong browser Vite dev, console 0 error: gõ `\frac{d}{dx}x^2` trong math block → nhấn Tính → spinner 150ms debounce → kết quả `2x` màu `--result` (indigo) render inline liền mạch.
- i18n: switch en↔vi runtime (không reload) → mọi UI text đổi (LaTeX/toán không đổi).
- Theme: switch light↔dark↔system (không reload, không nháy trắng) → màu đổi đúng token.
- Pen palette: pointer:fine → ẩn; pointer:coarse (DevTools emulate touch) → hiện.
- Toolbar: EDITING-MATH vs EDITING-TEXT vs RESULT-* → nội dung toolbar khác nhau đúng.
- Breakpoints: 834px (sub-compact) + 1280px (regular) + 1920px (wide) → layout không vỡ.

---

## Outcome cuối

- Bản mock Nib chạy trong browser (Vite dev): design + tính năng đầy đủ theo spec. Mock CAS stub frontend (≥10 fixture). Không backend thật, không MyScript thật.
- Output này là input trực tiếp cho Phase 1 (thay `mockCas.ts` bằng real `POST /eval`) và Phase 2 (wrap Tauri IPC).

---

## Revision log

| Date | Change | Lý do |
| --- | --- | --- |
| 2026-06-13 | Initial — 4 session, Phase 0 mock-UI | Tạo mới từ team nib-mock-ui, planner |
