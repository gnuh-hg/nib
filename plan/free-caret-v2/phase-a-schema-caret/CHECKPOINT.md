# CHECKPOINT — Phase A: Schema spacer-atom + click→virtual-caret + type→materialize

> Sổ tay tiến độ Phase A. Bất kỳ phiên Claude nào mới mở đều đọc file này TRƯỚC để biết đang ở đâu.

---

## ⚠️ Constraint reminder (ĐỌC ĐẦU MỖI CHAT)

- Mỗi chat **chỉ làm 1 session** (xem "Đang ở đâu" để biết session nào).
- **STOP NGAY** khi đạt STOP gate của session đó — không tham làm session kế dù còn quota.
- **TRƯỚC khi đóng chat**: cập nhật bảng tiến độ + "Đang ở đâu" + thêm 1 entry "Per-session log".
- **CẤM `deleteDatabase`** bất kỳ lúc nào (data safety).
- **Path B spacer-atom là LOCKED** — KHÔNG implement spacer bằng literal space char hay grid; KHÔNG bỏ ProseMirror.
- **Metrics đo runtime** — KHÔNG dùng hằng `CHAR_W=7`; `coordsAtPos` chỉ đo SAU DOM paint (rAF).
- **Vòng lõi (gõ text) phải SỐNG sau mỗi session** — nếu session phá build → rollback + report ngay.

---

## Tiến độ tổng quan

| Hạng mục | Mục tiêu | Hiện tại | % |
|---|---|---|---|
| Sessions hoàn thành | 3 | **3 (A.1,A.2,A.3)** | **100%** |
| Build pass (`npm run build` exit 0) | 3/3 session | A.1✓ A.2✓ A.3✓ | ✓ |
| `tsc --noEmit` 0 error | 3/3 session | A.1✓ A.2✓ A.3✓ | ✓ |
| vitest pass | 3/3 session | A.3 ✓ (84/84) | ✓ |
| Gate vàng Phase A pass | 1 (A.3) | **✅ ĐÓNG (Playwright 12/12 exit 0)** | ✓ |

---

## Đang ở đâu

- **Phase**: A ✅ **HOÀN TẤT** (gate vàng đóng, Playwright 12/12)
- **Session kế tiếp**: **Phase B** — `plan/free-caret-v2/phase-b-nav-edit/` (arrow nav 2D + backspace gap shrink + Tab spacer). Cần planner sinh long-plan Phase B trước.
- **Blocker**: không
- **Caveat carry**: IME case 10 = N/A Playwright (compositionstart không mô phỏng được headless) → **USER-SMOKE tiếng Việt** + robustness ở Phase C. E5 stale-IDB chưa gặp (mount sạch).

---

## Per-session log

### A.3 — Type → materialize + IME guard + BUG FIX (2026-06-25, @editor + @tester)
- NEW materializeInput.ts (materialize 1-tx: widthMap.set TRƯỚC dispatch → spacer → char → setSelection → clear vc cùng tx; materializeGap IME; measureSpaceWidth; isPrintableKey). MOD Workspace (handleKeyDown printable→materialize+return true; compositionstart→materializeGap+return false = IME fix R3). +materializeInput.test.ts.
- **BUG (tester Playwright bắt, case 3&9 FAIL):** materialize gọi lại `coordsAtPos(lineDocPos)` → vcaret widget (side:1) render tại pos đó → trả x WIDGET thay text-right → gap≈0 → spacer không tạo → text sai x. **FIX Option A:** đo `textRightClient` LÚC CLICK (handleClick), lưu vào VirtualCaretState; materialize tính `gap = virtualXClient − textRightClient`, KHÔNG gọi coordsAtPos nữa (regression guard: mock coordsAtPos throw → test vẫn pass).
- Gate (lead verify + tester re-smoke): tsc 0 · vitest 84/84 · build 0 · **Playwright 12/12 exit 0 (gate vàng ĐÓNG)**. Evidence tests/flows/evidence/free-caret-v2-phase-a/.

### A.2 — Click → virtual caret (plugin state + visual blink) (2026-06-25, @editor)
- NEW virtualCaret.ts (PluginKey + plugin; **apply = getMeta ?? prev** E1 no-clobber; decorations widget; helpers set/clear/get; MATERIALIZE_THRESHOLD=4), VirtualCaret.ts (extension), virtualCaret.test.ts (5 test gồm E1). MOD spacer.css (.nib-vcaret height-capped E6 + reduced-motion), Workspace (VirtualCaret ext + handleClick: pos<1 guard E2, gap detect, **return false KHÔNG setSelection thủ công**).
- Gate (lead verify độc lập): tsc 0 · vitest 79/79 (11 files, +5; E1 test xanh) · build 0. gitnexus additive.
- Caveat: visual blink + E5/E6 → smoke Playwright sau A.3.

### A.1 — SpacerAtom + schema + spacerWidthMap + CSS + test (2026-06-25, @editor)
- NEW SpacerAtom.ts (inline leaf atom, NodeView đọc width Y.Map, R2 rAF guard, E3 destroy unobserve), spacer.css (CC-1 pre-wrap + .nib-spacer), spacerAtom.test.ts (7 test gồm E3). MOD NibDocument (NibParagraph content `(spacer_atom|text)*`), yjs.ts (+SPACER_WIDTHS_MAP), Workspace (spacerWidthMap useMemo + SpacerAtom.configure).
- Gate (lead verify độc lập): tsc 0 · vitest 74/74 (10 files, +7) · build exit 0. gitnexus impact additive LOW.
- Caveat: E5 stale-IDB chưa smoke (KHÔNG deleteDatabase); .nib-vcaret + click/materialize để A.2/A.3.

---

## Lịch sử revision

| Date | Action | By |
|---|---|---|
| 2026-06-25 | Created from PLAN.md Phase A | @planner |
