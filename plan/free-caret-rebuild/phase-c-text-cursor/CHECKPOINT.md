# CHECKPOINT — Phase C: Text Engine + Cursor

> Sổ tay tiến độ Phase C. Bất kỳ phiên Claude nào mới mở đều đọc file này TRƯỚC để biết đang ở đâu.

---

## ⚠️ Constraint reminder (ĐỌC ĐẦU MỖI CHAT)

- Mỗi chat **chỉ làm 1 session** (xem "Đang ở đâu" để biết session nào).
- **STOP NGAY** khi đạt STOP gate của session đó — không tham làm session kế dù còn quota.
- **TRƯỚC khi đóng chat**: cập nhật bảng tiến độ + "Đang ở đâu" + thêm 1 entry "Per-session log".
- **MathInline VẪN là placeholder `[Math]` trong Phase C** — KHÔNG nhúng MathLive thật (Phase D). Atom là opaque unit cho nav, không có dual-caret, không có MathLive focus.
- **Ghost caret Phase C = virtual-space parking ONLY** — chưa handoff MathLive (§4 Phase D). Ghost chỉ xuất hiện khi caret ở virtual-space (dòng trống / quá cuối text). Token `--caret`, 0 hex rời.
- **Vòng lõi VẪN gián đoạn Phase C** — đây là đúng kế hoạch. KHÔNG cố gắng fix Tính/CAS ở Phase C.
- **HOW đã chốt tại**: ARCHITECTURE.md §5 (Click + Insert) + §6 (Arrow-Nav). Đọc trước khi code.

---

## Tiến độ tổng quan

| Hạng mục | Mục tiêu | Hiện tại | % |
|---|---|---|---|
| Sessions hoàn thành | 3 | 3 | 100% |
| Build + tsc 0 error | 3/3 session | 3/3 | 100% |
| RowView blankBefore/indent test | PASS | ✅ (rowView 14/14) | 100% |
| Text insert test (không đè) | PASS | ✅ ("aXbc") | 100% |
| Click-to-position test | PASS | ✅ (ghostCaret 10/10) | 100% |
| Ghost-park + materialize row test | PASS | ✅ (virtual-space invariant: 1 row, không N) | 100% |
| Up/down goalX test (3 rows) | PASS | ✅ (caretNav 15/15) | 100% |
| Left/right atom = 1 unit test | PASS | ✅ (atom nodeSize 1) | 100% |

vitest tổng: **157/157** (18 file). Lead verify độc lập mỗi session.

---

## Đang ở đâu

- **Phase**: C — Text Engine + Cursor ✅ ĐÓNG (lead gate PASS 2026-06-23, 3/3 session)
- **Session kế tiếp**: — (Phase C xong → USER smoke caret UX khuyến nghị → Phase D: MathLive inline + dual-caret)
- **Blocker**: không
- **Reference**: `../ROADMAP.md` Phase D
- **ArrowDown cuối doc (C.3 decision):** posAtCoords null → ghost-park dòng kế ảo + park PM end-of-doc (nhất quán với empty-line behavior).
- **Per-session:** C.1 RowView.tsx (rowStyle geometry) · C.2 ghostCaret.ts (click-to-position + materialize, transient không persist) · C.3 caretNav.ts (up/down goalX + Tab; left/right atom=PM default).

---

## Trạng thái vòng lõi (gõ→Tính→result)

| Trạng thái | Chi tiết |
|---|---|
| **VẪN gián đoạn (Phase C)** | mathInline placeholder [Math], không MathLive, không Tính/CAS. |
| Lộ trình | Phase D: MathLive inline + dual-caret → Phase E: CAS + gate vàng → vòng lõi hoàn toàn sống. |

---

## Context nhanh cho implementer khi bắt đầu mỗi session

### Session C.1 — Đọc trước
- `src/editor/geometry.ts` — RULE_HEIGHT=64, MARGIN_L=56 (dùng đúng const, KHÔNG hardcode)
- `src/editor/extensions/Row.ts` — RowView placeholder từ B.1 cần thay
- `plan/free-caret-rebuild/phase-a-architect/ARCHITECTURE.md §2` — blankBefore/indent semantics

### Session C.2 — Đọc trước
- `plan/free-caret-rebuild/phase-a-architect/ARCHITECTURE.md §5` — click spec + ghost-park + materialize
- `src/components/Workspace.tsx` — nơi wire click handler
- `src/editor/geometry.ts` — paperRef.getBoundingClientRect(), RULE_HEIGHT cho targetLine calc

### Session C.3 — Đọc trước
- `plan/free-caret-rebuild/phase-a-architect/ARCHITECTURE.md §6` — Arrow-Nav plugin spec (goalX, up/down, Tab)
- `src/editor/geometry.ts` — RULE_HEIGHT cho targetY calc
- `src/editor/plugins/ghostCaret.ts` — ghost-park state từ C.2 (caretNav cần clear goalX khi click)

### Constraints chung mọi session
- `mathInline` atom: `atom:true` → PM đã coi là opaque unit. KHÔNG cần custom left/right keymap — verify bằng test.
- Ghost caret = `--caret` CSS token. 0 hex rời.
- Ghost-park state = transient (React state hoặc PM plugin state). KHÔNG persist vào Y.Doc.
- Chạy `npm run build` + `tsc --noEmit` + `npx vitest run` + nộp evidence trước báo STOP gate.
- KHÔNG implement MathLive / dual-caret / Tính / CAS.

---

## Per-session log

_(chưa có session nào hoàn thành)_

---

## Lịch sử revision

| Date | Action | By |
|---|---|---|
| 2026-06-23 | Created | @planner (team caret-input) |
