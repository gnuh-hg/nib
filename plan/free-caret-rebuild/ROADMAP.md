# Nib — Free-Caret Rebuild Roadmap

> Bản đồ workstream "Free-Caret Document" (Hướng C) — rebuild toàn bộ document model từ block absolute-positioned sang **row-based với caret văn bản thật** đi xuyên trang. **Mỗi phase = 1 long-plan** soạn riêng khi user yêu cầu (nested dưới thư mục này). File này chỉ mô tả *cần làm gì* (WHAT) + *gate đo được* — KHÔNG chia session, KHÔNG thiết kế HOW.

---

## ⚠️ Quyết định [LOCKED] — user chốt khi đã biết rõ chi phí (2026-06-23)

1. **Mô hình nhập = FREE-CARET DOCUMENT THẬT (Hướng C)**: rebuild sang **ROW-BASED** — mỗi dòng = 1 chuỗi editable liên tục; math = inline atom; caret văn bản thật đi xuyên cả trang; click/di chuyển tới bất kỳ cột/dòng; gõ = **INSERT** (chèn), không đè ký tự sau; caret đi xuyên qua block toán inline ("2x + ∫f│dx + 3" = 1 chuỗi liền, model mental = tờ giấy fill sẵn khoảng-trắng).
2. **MathLive giữ** nhưng chuyển sang dạng **inline atom** — không còn là full-editor block chiếm toàn block tself; bỏ 2 nút toolbar mặc định MathLive (☰ hamburger menu + ⌨ virtual-keyboard toggle).
3. **BẢO TOÀN DỮ LIỆU — gate cứng không thể bỏ**: tài liệu cũ trong IndexedDB (`nib-ydoc-*`, `nib-ydoc-u-${userId}__${docId}`) **KHÔNG được xóa / mất**; migration phase phải có path an toàn + fallback; không có phase nào được `deleteDatabase` hay ghi đè store cũ mà không backup (bổ sung quyết định per-user IDB isolation 2026-06-22).
4. **Vòng lõi sống sau mỗi phase**: "gõ → Tính → kết quả symbolic inline" là gate vàng — mỗi phase rebuild PHẢI verify vòng lõi còn chạy (hoặc ghi rõ lý do tạm gián đoạn có kiểm soát với lộ trình phục hồi ở phase kế).

---

## Nền tảng giữ nguyên (không rebuild)

- **Stack [LOCKED]** từ `CLAUDE.md §3–§6`: Tauri 2 + React/TS/Vite + TipTap (ProseMirror) + MathLive + SymPy sidecar cục bộ.
- **SymPy sidecar** — offline-only, không đổi; cloud sync KHÔNG đụng đến sidecar.
- **Auth + Supabase** (Phase A accounts-cloud-sync DONE) — giữ nguyên.
- **Yjs (CRDT) sync engine** (Phase B accounts-cloud-sync DONE) — **adapt** cho schema mới theo thiết kế Phase A; KHÔNG dùng lại schema cũ (nhưng tái dùng y-prosemirror, y-indexeddb, HocuspocusProvider).
- **Design tokens** (`src/styles/tokens.css`) — giữ nguyên; mọi block/UI mới dùng token, 0 hex rời.

---

## Cross-cutting rủi ro — phải giải trong Phase A Architect trước khi code

| # | Rủi ro | Bằng chứng (researcher Task #1) | Giải ở phase |
|---|---|---|---|
| R1 | **CRDT bloat**: fill-space thật → Y.Doc ~180KB cho doc trống (~5000 Y.Map items, anti-pattern). Cần lazy-fill / synth whitespace khi commit thay vì lưu literal spaces vào CRDT. | Model IntelliJ virtual-space; Yjs CRDT append-only structure | Phase A: architect thiết kế whitespace strategy |
| R2 | **Dual-caret ghost**: ghost caret (PM `Decoration.widget` CSS) ↔ MathLive internal caret phải đồng bộ đúng thứ tự (focus/blur event, click vào math mid-word, arrow-out). Sai → 2 cursor hiện cùng lúc hoặc focus leak. | MathLive+PM bug đã biết: focus MathField → PM selection clear (discuss.prosemirror.net/t/.../9021) | Phase A: architect thiết kế handoff + sync order |
| R3 | **Migration Y.Doc**: schema mới → tài liệu IndexedDB cũ (`nib-ydoc-*`) có thể không deserialize → **MẤT DỮ LIỆU** nếu không có path an toàn + fallback. | Yjs append-only update stream không tự-convert khi schema đổi | Phase A: thiết kế migration detect → convert → fallback an toàn |
| R4 | **Insert semantics**: khi caret nằm giữa 2 inline-math atoms cùng row — hành vi type/backspace/delete chưa định nghĩa. | Research Task #1 R4 | Phase A: định nghĩa contract |
| R5 | **Arrow-nav 2D**: ProseMirror selection linear; cần custom plugin cho up/down giữa rows + left/right qua math atoms. | feature.md §2.5 | Phase A: thiết kế plugin interface |
| R6 | **Vòng lõi continuity**: nếu gõ trong row-based bypass MathLive → mất WYSIWYG live render (x^2→x²) → Tính nhận text thuần không parse được → kết quả sai/không có. | Research Task #1 R6 | Phase A: xác nhận MathLive vẫn là WYSIWYG engine cho math atom + Tính target trong row-based |

---

## Các phase

### Phase A — Architect (BLOCKING: giải R1–R6 trước khi bất kỳ code nào được viết)

- **Cần làm gì (WHAT)**:
  - Đọc toàn bộ source hiện tại: `Workspace.tsx`, `NibBlockView.tsx`, `NibBlock.ts`, `yBlockMeta.ts`, `geometry.ts`, `MathField.tsx` + `ARCHITECTURE.md` (Phase B accounts-cloud-sync).
  - Thiết kế **PM schema mới row-based**: node types (row, inline-math, inline-text, kết quả), attributes tối thiểu.
  - Thiết kế **Y.Doc structure** phù hợp schema mới — giải R1 (whitespace strategy, không lưu literal spaces vào CRDT).
  - Thiết kế **migration path an toàn** R3: detect old schema → convert path → fallback nếu không convert được → KHÔNG bao giờ xóa store cũ.
  - Thiết kế **dual-caret** R2: ghost caret (Decoration.widget) ↔ MathLive caret handoff, sync order, edge cases.
  - Định nghĩa **insert semantics + click-to-position** R4: hành vi type/backspace giữa atoms; click → cursor set.
  - Thiết kế **arrow-nav 2D plugin interface** R5: up/down/left/right xuyên rows + math atoms.
  - Xác nhận **vòng lõi continuity** R6: Tính target trong row-based (selection range → extract LaTeX), kết quả inline position, MathLive WYSIWYG giữ được.
  - Giải C2 (từ research): hit-test click vào math atom có nội dung.
  - Sản xuất `ARCHITECTURE.md` (trong `plan/free-caret-rebuild/phase-a-architect/`).
- **Cần làm rõ trước**: không (C1 đã chốt: LEFT arrow vào math atom kề = CÓ).
- **Done khi**: `plan/free-caret-rebuild/phase-a-architect/ARCHITECTURE.md` tồn tại với đủ 7 section (Schema / Y.Doc + Whitespace / Migration / Dual-Caret / Insert-Semantics / Arrow-Nav / Vòng-lõi); mọi R1–R6 có thiết kế cụ thể; lead gate PASS; KHÔNG có file nào trong `src/` bị sửa.
- **Phụ thuộc**: không

---

### Phase B — Schema + Migration

- **Cần làm gì (WHAT)**:
  - Implement PM schema mới (row, inline-math, inline-text nodes + TipTap extensions) theo ARCHITECTURE.md.
  - Y.Doc structure mới + y-indexeddb persistence với schema mới.
  - **Migration module**: detect old `nib-ydoc-*` / `nib-ydoc-u-${userId}__${docId}` → convert sang schema mới hoặc preserve original với thông báo; path KHÔNG bao giờ xóa dữ liệu.
  - Unit test: tạo fake old-schema doc → migrate → kiểm nội dung còn nguyên.
- **Cần làm rõ trước**: ARCHITECTURE.md Phase A lead gate PASS.
- **Done khi**: `npm run build` exit 0 + `tsc --noEmit` 0 error + vitest pass; migration test pass (old doc → migrate → content preserved); new empty doc loads không crash; vòng lõi **tạm gián đoạn có kiểm soát** (chấp nhận ở phase này vì engine chưa xong) — ghi rõ trạng thái trong CHECKPOINT.
- **Phụ thuộc**: Phase A done.

---

### Phase C — Text Engine + Cursor

- **Cần làm gì (WHAT)**:
  - Row-based text input (type = insert tại cursor position, không đè).
  - Cursor left/right xuyên content (text + math atoms như opaque unit — chưa đi vào trong).
  - Cursor up/down giữa rows.
  - Click-to-position (`posAtCoords` → PM selection set).
  - Math atom render placeholder (chưa MathLive thật, cần đủ để nav kiểm được).
- **Done khi**: `npm run build` + `tsc --noEmit` 0 + vitest pass; gõ ký tự → chèn đúng vị trí; left/right qua math atom như 1 unit (không vào trong); up/down chuyển row; click bất kỳ → cursor đặt đúng; vòng lõi **vẫn gián đoạn** (math atom chưa MathLive thật) — ghi rõ CHECKPOINT.
- **Phụ thuộc**: Phase B done.

---

### Phase D — Inline Math + Dual-Caret

- **Cần làm gì (WHAT)**:
  - MathLive nhúng làm **inline atom thật** (`<math-field>` trong PM NodeView inline).
  - Focus handoff: caret enter math atom (Left/Right/Click) → MathLive caret active.
  - Exit math atom (Left arrow tại đầu / Right arrow tại cuối atom) → ghost caret resume.
  - Dual-caret ghost (PM `Decoration.widget`) sync với MathLive focus state.
  - **Bỏ 2 nút toolbar MathLive**: ☰ hamburger menu + ⌨ virtual-keyboard toggle (config MathLive `menuItems:[] toolbar:false` hoặc tương đương).
  - Live render WYSIWYG giữ trong math atom (x^2 → x², ∫, Σ...) — R6 giải xong tại phase này.
- **Done khi**: `npm run build` + `tsc --noEmit` 0 + vitest pass; gõ "x^2" trong math atom → hiện x²; Left arrow từ text → vào math atom MathLive caret active; Left arrow đầu atom → caret ra ngoài ghost; ☰ và ⌨ **không** xuất hiện; vòng lõi **gõ → render WYSIWYG sống** hoạt động; console 0 error.
- **Phụ thuộc**: Phase C done.

---

### Phase E — CAS + Vòng lõi (Gate vàng)

- **Cần làm gì (WHAT)**:
  - Nút Tính: extract LaTeX từ selection hoặc math atom gần cursor trong row-based model.
  - Gửi LaTeX → CAS sidecar (IPC giữ nguyên từ Phase 0) → nhận `exact_latex` / `approx_latex`.
  - Render kết quả inline sau biểu thức (màu `--result` indigo; cùng row nếu ngắn, xuống row kế nếu dài — theo `feature.md §6`).
  - Loading indicator + timeout (configurable, ~5–10s) + error state (`--error`).
  - Toggle exact ↔ decimal (frontend chọn từ response đã có, không re-call CAS).
- **Done khi**: **Gate vàng**: gõ "x^2" vào math atom → nhấn Tính → kết quả "2x" hiện inline màu `--result`; `\int x\,dx` → `\frac{x^2}{2} + C`; build 0 + tsc 0 + vitest pass; loading indicator hiển thị; timeout không crash; i18n en/vi parity.
- **Phụ thuộc**: Phase D done.

---

### Phase F — Sync + Polish

- **Cần làm gì (WHAT)**:
  - Yjs (y-prosemirror + Y.Map side-channel strategy từ ARCHITECTURE.md Phase A) adapt cho schema mới.
  - Verify 2-tab live sync: edit tab 1 → tab 2 phản chiếu <1s (với Hocuspocus local).
  - Keyboard shortcuts giữ (Ctrl+Z/Y undo, Shift+Enter Tính, Ctrl+K Palette).
  - UX edge cases: nhiều math atoms cùng row, kết quả dài xuống row kế, migration notice nếu doc cũ không convert được.
  - 0 hex rời; i18n parity en/vi; design tokens không regression.
- **Done khi**: `npm run build` + `tsc --noEmit` 0 + vitest pass; 2-tab sync: xOffset/latex/result đồng bộ trong <1s; Ctrl+Z undo đúng; vòng lõi gõ→Tính→result inline **hoàn toàn sống** end-to-end; 0 hex rời.
- **Phụ thuộc**: Phase E done.

---

## Thứ tự phụ thuộc

```
Phase A (Architect: giải R1–R6 → ARCHITECTURE.md → lead gate PASS)
      │
      ▼
Phase B (Schema + Migration: PM schema mới + Y.Doc + migrate old docs SAFE)
      │ build 0 + migration safe (vòng lõi tạm gián đoạn có kiểm soát)
      ▼
Phase C (Text Engine: row text + insert + cursor + click)
      │ insert + arrow nav + click (math atom placeholder)
      ▼
Phase D (Inline Math + Dual-Caret: MathLive inline + ghost caret + bỏ 2 toolbar buttons)
      │ R6 resolved: WYSIWYG sống; console 0 error
      ▼
Phase E (CAS + Vòng lõi: Tính + result inline → GATE VÀNG)
      │ "gõ x^2 → Tính → 2x inline" pass
      ▼
Phase F (Sync + Polish: Yjs new schema + 2-tab verify + edge cases)
```

---

## Cách dùng file này

Mỗi lần build 1 phase: user trỏ vào phase → planner dựng `plan/free-caret-rebuild/<phase-slug>/PLAN.md` + `CHECKPOINT.md` (nested dưới thư mục này). Cập nhật bảng dưới khi phase thay trạng thái.

| Phase | Long-plan | Trạng thái |
|---|---|---|
| A — Architect | `plan/free-caret-rebuild/phase-a-architect/` | ✅ ARCHITECTURE.md §1–§7 gate PASS (2026-06-23) |
| B — Schema + Migration | `plan/free-caret-rebuild/phase-b-schema-migration/` | ✅ 3/3 session PASS — tsc 0, vitest 118/118, R1<1KB, migration 12/12, deleteDatabase NEVER, room :v2 (2026-06-23) |
| C — Text Engine + Cursor | `plan/free-caret-rebuild/phase-c-text-cursor/` | ✅ 3/3 session PASS — tsc 0, vitest 157/157, RowView geometry, click+ghost-caret, arrow-nav 2D goalX (2026-06-23) |
| D — Inline Math + Dual-Caret | — | ⬜ |
| E — CAS + Vòng lõi | — | ⬜ |
| F — Sync + Polish | — | ⬜ |
