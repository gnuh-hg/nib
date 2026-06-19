# CHECKPOINT — Nib Mock-UI shell (Phase 0)

> Sổ tay tiến độ dài hạn. Bất kỳ phiên Claude nào mới mở đều đọc file này TRƯỚC để biết đang ở đâu.

---

## ⚠️ Constraint reminder (ĐỌC ĐẦU MỖI CHAT)

- Mỗi chat **chỉ làm 1 session** (xem "Đang ở đâu" để biết session nào).
- **STOP NGAY** khi đạt STOP gate của session đó — không tham làm session kế dù còn token quota.
- **TRƯỚC khi đóng chat**: cập nhật bảng tiến độ + "Đang ở đâu" + thêm 1 entry "Per-session log".
- **Đọc architect HOW design** (output Task #1 của team nib-mock-ui) **TRƯỚC** khi bắt đầu bất kỳ session implement nào. Nếu architect chưa xong → chờ, không tự quyết component tree / file structure / API contract.
- **Cấm Phase 0**: MyScript thật / backend FastAPI thật / Tauri IPC thật / ink capture thật. Chỉ mock CAS stub frontend.
- **Cấm luôn**: hex rời trong code (phải qua `var(--token)`). Hardcode text UI (phải qua `t('key')`). `min-width` CSS < 820px trong responsive logic.
- **CC-6 (TipTap vs Lexical)** phải chốt trước Session 1.2 — implementer hỏi lead nếu chưa rõ.
- 3 yêu cầu nền bắt buộc mọi component: song ngữ en/vi · desktop-class 820px+ · theme + design tokens. Xem `docs/requirements.md`.

---

## Tiến độ tổng quan

| Hạng mục | Mục tiêu | Hiện tại | % |
| --- | --- | --- | --- |
| Sessions hoàn thành | 4 | 4 | 100% |
| Gate pass | 4/4 | 4/4 | 100% |
| Token CSS (`tokens.css`) | ≥30 token semantic | ✅ pass | 100% |
| Mock CAS fixture | ≥10 fixture | 0 | 0% |
| i18n key | ≥12 key (en+vi) | ✅ pass | 100% |

---

## Đang ở đâu

- **Phase**: 0 — Mock-UI shell
- **Phase 0 core**: ✅ **HOÀN CHỈNH** (2026-06-13) — 4/4 session PASS.
- **Visual refinement**: Task #7 (static render polish) đã xoá — fold vào **Task #8** đang in progress: redesign editor khớp hi-fi mock (`docs/design-ref-editor.html`) — top chrome giàu hơn + KaTeX result render (fix luôn bug số mũ) + toolbar/pen palette polish.
- **Session kế tiếp**: Phase 1 — Real CAS (FastAPI+SymPy) khi user trỏ vào. Xem `plan/ROADMAP.md`.

---

## Per-session log

### 2026-06-13 — Session 1.1 ✅
- **Done**: Scaffold Vite+React/TS + `src/styles/tokens.css` + theme light/dark/system (no-flash) + i18n en/vi provider.
- **Output**: `tokens.css`, `locales/en.json`, `locales/vi.json`, `useTheme.ts`, `useI18n.ts`, `main.tsx`, `App.tsx`, `vite.config.ts`, `tsconfig.json`.
- **Gate**: ✅ PASS — `npm run build` exit 0 · `tsc --noEmit` 0 error · 0 hex rời · dev server 200 · theme switch không nháy · i18n switch hoạt động.
- **Next**: Session 1.2 — Canvas + block placement model.

### 2026-06-13 — Session 1.2 ✅
- **Done**: Ruled-paper canvas 64px + TipTap NodeView free-placement (lineIndex+xOffset) + active-block `--accent-subtle` + left-edge 2px `--accent` + blur-delete empty block.
- **Output**: `Canvas.tsx`, `Block.tsx` (base NodeView), `useBlockPlacement.ts`, `canvas.css` (breakpoints 4).
- **Gate**: ✅ PASS — `npm run build` exit 0 · `tsc --noEmit` 0 error · vitest 9/9 · 0 hex rời · dev server 200.
- **Next**: Session 1.3 — Math/Text block + Mock CAS + State machine + Result render (vòng lõi gõ→Tính→kết quả).

### 2026-06-13 — Session 1.3 ✅ 🏆 GATE VÀNG
- **Done**: MathLive math block WYSIWYG + Text block (B/I/U/S + 3 bậc cỡ) + nút Convert toggle toán↔chữ + nút Tính → mock CAS stub (≥10 fixture) + state machine §5 (EVALUATING/RESULT-EXACT/RESULT-APPROX/ERROR) + render kết quả §6 liền mạch (`--result`/`--approx`) + badge ≈ spec + inline toggle chip exact↔decimal.
- **Output**: `MathBlock.tsx`, `TextBlock.tsx`, `mockCas.ts`, `eval.ts`, `useBlockState.ts`, `ResultView.tsx`, `BadgeApprox.tsx`, `ToggleChip.tsx`, `EvalSpinner.tsx`.
- **Gate**: ✅ PASS VÀNG — `npm run build` exit 0 · `tsc --noEmit` 0 error · vitest 27/27 · risk#3 MathLive+TipTap spike OK · lead screenshot verify vòng gõ→Tính→kết quả MathLive render thật.
- **Next**: Session 1.4 — UX 4 lớp + Pen palette + Onboarding (session cuối).

### 2026-06-13 — Session 1.4 ✅ — PHASE 0 COMPLETE
- **Done**: Floating toolbar 4 biến thể (EDITING-MATH/TEXT/RESULT-*/no-active) + `Ctrl+K` command palette + `\` symbol menu + pen palette UI-only (ẩn pointer:fine) + onboarding starter content + ghost text + SVG icon set (Tính/Convert/Pen nib/Highlighter/Eraser/Lasso/VirtualKB/Toggle).
- **Output**: `FloatingToolbar.tsx`, `CommandPalette.tsx`, `SymbolPanel.tsx`, `PenPalette.tsx`, `StarterContent.tsx`, `GhostText.tsx`, `useContextualTips.ts`, `src/assets/icons/*.svg`.
- **Gate**: ✅ PASS — `npm run build` exit 0 · `tsc --noEmit` 0 error · vitest 31/31 · 0 hex rời · 0 emoji · i18n parity 76/76 · lead screenshot verify 4 toolbar states.
- **Phase 0 gate vàng**: vòng "gõ → Tính → kết quả mock symbolic inline" end-to-end browser ✅ · i18n en↔vi ✅ · theme light/dark/system ✅ · pen palette ẩn/hiện đúng modality ✅.
- **Notes**: 1 polish nhỏ còn lại — Task #7 static result render số mũ/phân số (`ResultView.tsx`), không chặn Phase 0 gate.

---

## Lịch sử revision

| Date | Action | By |
| --- | --- | --- |
| 2026-06-13 | Created from `PLAN.md` | planner |
| 2026-06-13 | Session 1.1 PASS → Session 1.2 in progress | planner |
| 2026-06-13 | Session 1.2 PASS → Session 1.3 in progress | planner |
| 2026-06-13 | Session 1.3 PASS (gate vàng) → Session 1.4 in progress | planner |
| 2026-06-13 | Session 1.4 PASS → Phase 0 HOÀN CHỈNH (4/4) | planner |
