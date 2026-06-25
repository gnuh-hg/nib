# Nib — Roadmap: free-caret-v2 (virtual-space spacer-atom)

> Rebuild đường gõ của editor từ zero sau WIPE 2026-06-25, theo mô hình **"virtual-space free-caret" Path B "spacer-atom"** đã được user chốt qua AskUserQuestion + feasibility verdict (context.md 2026-06-25). App shell + Yjs (y-prosemirror) còn nguyên; schema tối thiểu `doc→paragraph(inline*)→text` là điểm bắt đầu. Mỗi phase = 1 long-plan riêng nested dưới thư mục này. File này mô tả **WHAT + cần-làm-rõ**, không chia session.

---

## Nền tảng đã chốt (không bàn lại)

**Từ CLAUDE.md [LOCKED] §3–§6:**
- Stack: Tauri 2 + React/TS/Vite + TipTap/ProseMirror + MathLive + FastAPI/SymPy.
- Document dạng block, hai input (gõ + bút), desktop-class ≥1024px.
- Build thẳng trên `main` (user chốt 2026-06-23).

**Từ AskUserQuestion 2026-06-25 [LOCKED] — MODEL free-caret-v2:**
- **Mô hình ngang**: float trong dòng — caret đặt đúng chỗ click; **space CHỈ materialize khi GÕ** (không pre-fill → không rác, copy sạch, merge tự nhiên).
- **Căn cột GẦN ĐÚNG**: user chấp nhận lệch do proportional font + math (chọn plan-A, KHÔNG snap-at-math, KHÔNG hybrid-C).
- **Constraints cứng**: KHÔNG float coordinates raw; KHÔNG integer grid cứng (vỡ vì char width khác nhau + math).

**Từ FEASIBILITY VERDICT (researcher Task #4, gate PASS) [LOCKED]:**
- **Path B "spacer-atom"** = lời giải: `paragraph: (spacer_atom | text)*`.
  - `spacer_atom` = inline LEAF atom attr `{id: string}` (static, không mutate). Width (float px) lưu trong **Y.Map "nib-spacer-widths" side-channel** keyed by id (CC-safe, né bug CC-1 node-attr).
  - Đoạn text = PM text node thường.
  - pos/len KHÔNG lưu — đo runtime `coordsAtPos` (browser đo chính xác proportional + math).
  - Merge tự nhiên: width→0 → PM xoá atom → 2 đoạn dính (không cần code merge tay).
- **Path A** (nhiều positioned span) = BẤT KHẢ THI (PM 1 contentDOM; transform phá selection+caret).
- **Path C** (bỏ PM) = vi phạm [LOCKED] §5, chỉ nếu Path B chết.

**Quyết định LOCKED phiên 2026-06-25:**
- Merge = **left-anchor** (`new_pos = s[j].pos`, xác định, khớp gõ trái→phải).
- Metrics = **đo runtime**: `space_width` qua `canvas.measureText(' ')`, char-width qua `coordsAtPos`. Cấm hằng `CHAR_W=7`.
- Tab = 4×space_width (configurable).
- Gõ tại gap / IME = **materialize-on-input** (phím | IME → spaces+char thành thật ngay; KHÔNG park PM-selection ở pos vô lệ — đây là fix gốc bug ghost-park-IME đã làm sập row-based cũ).
- `line_len` = paper width 664px.
- Pagination dọc = presentation tách rời (coupling duy nhất: segment cần `white-space:nowrap`).
- **CẤM `deleteDatabase`** bất kỳ lúc nào (data safety — user chốt 2026-06-22/23).

---

## Cross-cutting (theo dõi trạng thái)

| CC | Nội dung | Giải ở Phase | Trạng thái |
|---|---|---|---|
| CC-1 | `white-space: pre-wrap` trên `.nib-pm p` — hiển thị multiple spaces đúng | A | ⬜ |
| CC-2 | spacerWidthMap = Y.Map "nib-spacer-widths" shared trong ydoc; bind vào YjsSync | A | ⬜ |
| CC-3 | Y.UndoManager phải track `[xmlFragment, spacerWidthMap]` — R1 feasibility | C | ⬜ |
| CC-4 | copy/paste strip spacer atoms khỏi clipboard text (copy sạch) | C | ⬜ |
| CC-5 | MathLive inline atom drag-conflict (R5) fix trước khi mount math inline | D | ⬜ |
| CC-6 | `coordsAtPos` chỉ đo sau DOM paint — đo trong `view.updateState`/rAF, KHÔNG trong appendTransaction (R4) | A | ⬜ |

---

## Rủi ro carry-over (R1–R5, gắn vào phase xử lý)

| Rủi ro | Nội dung | Phase xử lý |
|---|---|---|
| R1 | Y.UndoManager chỉ track xmlFragment → undo lệch spacer width | Phase C (CC-3) |
| R2 | post-render measure→Y.Map update cần guard `new!==old` + rAF (tránh loop vô tận) | Phase A (NodeView observe) |
| R3 | IME trong gap: compositionstart phải trigger materialize TRƯỚC composition | Phase A (Session A.3) + Phase C (robustness) |
| R4 | `coordsAtPos` chưa chính xác trước DOM paint → đo trong view.updateState/rAF | Phase A (CC-6) |
| R5 | MathLive inline `atom:true inline:true` drag-conflict documented | Phase D (CC-5) |

---

## Các phase

### Phase A — Schema spacer-atom + click→virtual-caret + type→materialize

- **Cần làm gì (WHAT)**:
  1. `SpacerAtom` TipTap extension: inline LEAF, attr `{id}`, NodeView renders `<span class="nib-spacer">` với width từ Y.Map (R2 guard: `new!==old` + rAF update); observe Y.Map change → update DOM width.
  2. Cập nhật `NibParagraph` schema content: `'(spacer_atom | text)*'`.
  3. `spacerWidthMap` Y.Map "nib-spacer-widths" khởi tạo + bind trong YjsSync/Workspace (CC-2).
  4. `white-space: pre-wrap` trên `.nib-pm p` (CC-1).
  5. Click handler: tính virtual x từ click event → `posAtCoords` → nếu click vào gap (x > `coordsAtPos(nearestPos).right`) → lưu virtual caret state; đo sau DOM paint (CC-6, R4).
  6. Visual cursor tại virtual x (Decoration.widget blink, ephemeral — KHÔNG persist vào Yjs).
  7. `handleKeyDown` + `compositionstart` intercept: khi virtual caret active → materialize (gap → tính spacer width + insert spacer_atom + char; spaces materialize-on-input); clear virtual caret state (R3 guard).
- **Cần làm rõ trước**: không — feasibility đủ, R4 (coordsAtPos) xử lý trong Session A.2 via rAF.
- **Done khi (gate vàng Phase A)**: "click bất kỳ trên dòng → gõ → text xuất hiện tại đúng x, spaces materialized" — `npm run build` exit 0 + `tsc --noEmit` 0 error + vitest pass + console 0 JS error.
- **Phụ thuộc**: không (app shell còn nguyên, build thẳng main).
- **Rủi ro cần giải ở phase này**: R2, R3 (initial), R4, CC-1, CC-2, CC-6.

### Phase B — Arrow navigation + editing in gap

- **Cần làm gì (WHAT)**:
  1. Left/right arrow: trong segment text = PM default; ra gap / vào gap = dịch virtual x ± `space_width` (không thay đổi PM doc, chỉ di chuyển virtual caret).
  2. Up/down arrow: đổi dòng, bảo toàn goalX (`coordsAtPos`/`posAtCoords` 2D như free-caret-rebuild §6).
  3. Backspace khi virtual caret trong gap: shrink spacer width bằng `space_width` (cập nhật Y.Map); nếu width→0 → PM xoá atom → merge tự nhiên.
  4. Delete khi text kề gap: PM default delete.
  5. Tab: chèn spacer_atom mới width=4×space_width tại vị trí hiện tại.
- **Cần làm rõ trước**: không (spec đủ từ context.md — "arrow-gap = space_width steps").
- **Done khi**: left/right xuyên gap đúng x (visual cursor di chuyển); up/down giữ goalX khi chuyển dòng; backspace tại gap shrink spacer rồi merge; Tab tạo spacer đúng width + `npm run build` 0 + vitest pass.
- **Phụ thuộc**: Phase A PASS.
- **Rủi ro**: không có rủi ro mới; R4 (coordsAtPos) cần bảo toàn từ A.

### Phase C — IME + Undo/Redo + Copy/Paste

- **Cần làm gì (WHAT)**:
  1. IME robustness: `compositionstart` → materialize-before-composition đầy đủ; `compositionupdate`/`compositionend` → finalize; xử lý cancel composition edge case (R3 complete).
  2. Y.UndoManager: track `[xmlFragment, spacerWidthMap]` trong YjsSync (R1 — CC-3); undo/redo khôi phục đúng cả text lẫn spacer width.
  3. Copy: strip spacer atoms khỏi clipboard text (CC-4) — `ClipboardEvent` handler lọc spacer_atom khỏi serialized text.
  4. Paste tại virtual caret: materialize-before-paste → paste text thường.
- **Cần làm rõ trước**: không.
- **Done khi**: gõ tiếng Việt (telex) tại gap → text đúng (IME pass); undo → spacer width khôi phục đúng; redo → re-materialize đúng; copy dòng có spaces ảo → paste → text sạch không dính space literal thừa. `npm run build` 0 + vitest pass.
- **Phụ thuộc**: Phase A + Phase B PASS.
- **Rủi ro**: R1 (CC-3 UndoManager track) — nếu bỏ qua, undo sẽ corrupt spacer width.

### Phase D — MathLive inline atom + dual-caret

- **Cần làm gì (WHAT)**:
  1. `MathInlineAtom` TipTap extension: inline atom trong schema `paragraph: (spacer_atom | math_inline | text)*`.
  2. Coexistence: spacer_atom kề math_inline — coordsAtPos reference đúng (R1 researcher: `coordsAtPos(end_of_atom).right`).
  3. Dual-caret handoff: PM text caret ↔ MathLive focus (rAF-defer, tránh bug PM-selection-clear — theo ARCHITECTURE §4 free-caret-rebuild).
  4. MathLive drag-conflict (R5 — CC-5) fix.
  5. Arrow left/right xuyên qua math_inline atom 1 bước.
  6. Bỏ 2 nút toolbar MathLive (☰ menu + ⌨ virtual-keyboard) — user yêu cầu từ 2026-06-23.
  7. Q3 overflow: nếu math atom rộng hơn `line_len` → chiến lược cắt/cuộn (quyết ở phase này hoặc để user chốt).
- **Cần làm rõ trước**: spike MathLive inline `setCaretPoint`/`position` API (≤1 ngày) trước Session D.1 — xác nhận API expose đủ để dual-caret.
- **Done khi**: gõ text → `\int` → MathLive block inline mount → caret vào block (click/arrow) → ra bằng arrow → text tiếp tục; bỏ 2 nút toolbar thành công; 0 JS error; `npm run build` 0 + vitest pass.
- **Phụ thuộc**: Phase A + Phase B PASS. Phase C có thể song song (khác vùng code).
- **Rủi ro**: R5 (CC-5 drag-conflict); spike MathLive API phải xác nhận trước (CLAUDE.md §8 — editor là đường găng).

### Phase E — CAS + Vòng lõi (gate vàng tối thượng)

- **Cần làm gì (WHAT)**:
  1. Wire CAS pipeline: LaTeX từ MathLive atom → `POST /eval` FastAPI/SymPy → nhận kết quả LaTeX symbolic.
  2. Render kết quả inline cạnh/dưới atom (live update khi edit).
  3. Gate vàng end-to-end.
- **Cần làm rõ trước**: backend CAS phải running (FastAPI + SymPy + latex2sympy2; xem workstream `accounts-cloud-sync`/backend; `POST /eval` pass ≥3 fixture).
- **Done khi**: **GATE VÀNG TỐI THƯỢNG** — "gõ `x^2` → Tính → `2x` inline live, kết quả cập nhật mỗi khi edit" — `npm run build` 0 + `pytest` pass + `POST /eval {"latex":"x^2"}` → `{"result":"2x"}` + console 0 error.
- **Phụ thuộc**: Phase D PASS + backend CAS sẵn (có thể dùng FastAPI local dev).
- **Rủi ro**: SymPy chậm/timeout → cần timeout config + numeric fallback (CLAUDE.md §8.3); LaTeX→SymPy lossy (§8.2) → đủ fixture test.

---

## Thứ tự phụ thuộc

```
Phase A (schema spacer-atom + click→caret + type→materialize)
         │
         ▼
Phase B (arrow nav 2D + backspace/delete gap)
         │
         ├──────────────────────────────►Phase C (IME + undo/redo + copy-paste)
         │                                        │
         ▼                                        │
Phase D (MathLive inline + dual-caret) ◄──────────┘
         │
         ▼
Phase E (CAS + vòng lõi — gate vàng tối thượng)
```

> **Nguyên tắc bất biến mọi phase:**
> (1) Vòng lõi (caret + gõ text) PHẢI SỐNG sau mỗi phase — không phase nào phá vỡ A.
> (2) CẤM `deleteDatabase` bất kỳ lúc nào — Yjs IDB là bản sao duy nhất.
> (3) Path B spacer-atom là kiến trúc dứt khoát — nếu vỡ, escalate user trước khi thử Path C (bỏ PM).

---

## Cách dùng file này

Mỗi lần build 1 phase: user trỏ vào phase → dùng `plan-long` dựng `plan/free-caret-v2/<phase-slug>/PLAN.md` + `CHECKPOINT.md`, chốt "cần làm rõ" trước rồi chia session. Cập nhật bảng dưới khi phase xong.

| Phase | Long-plan | Trạng thái |
|---|---|---|
| A — Schema spacer-atom + click→caret + type→materialize | `plan/free-caret-v2/phase-a-schema-caret/` | 🔄 |
| B — Arrow navigation 2D + editing in gap | `plan/free-caret-v2/phase-b-nav-edit/` | ⬜ |
| C — IME + Undo/Redo + Copy/Paste | `plan/free-caret-v2/phase-c-ime-undo/` | ⬜ |
| D — MathLive inline atom + dual-caret | `plan/free-caret-v2/phase-d-math-inline/` | ⬜ |
| E — CAS + Vòng lõi (gate vàng tối thượng) | `plan/free-caret-v2/phase-e-cas-loop/` | ⬜ |
