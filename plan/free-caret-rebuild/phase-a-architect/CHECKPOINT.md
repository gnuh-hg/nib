# CHECKPOINT — Phase A Architect: Free-Caret Rebuild

> Sổ tay tiến độ Phase A. Bất kỳ phiên Claude nào mới mở đều đọc file này TRƯỚC để biết đang ở đâu.

---

## ⚠️ Constraint reminder (ĐỌC ĐẦU MỖI CHAT)

- Mỗi chat **chỉ làm 1 session** (xem "Đang ở đâu" để biết session nào).
- **STOP NGAY** khi đạt STOP gate của session đó — không tham làm session kế dù còn quota.
- **Phase A KHÔNG được ghi bất kỳ file nào trong `src/`, `backend/`, `src-tauri/`** — output duy nhất = `plan/free-caret-rebuild/phase-a-architect/ARCHITECTURE.md`.
- **TRƯỚC khi đóng chat**: cập nhật bảng tiến độ + "Đang ở đâu" + thêm 1 entry "Per-session log".
- **Không tự chốt câu hỏi còn mở** (§11 CLAUDE.md) và không đề xuất ngược [LOCKED] stack.

---

## Tiến độ tổng quan

| Hạng mục | Mục tiêu | Hiện tại | % |
|---|---|---|---|
| Sessions hoàn thành | 2 | 2 | 100% |
| Section ARCHITECTURE.md | 7 | 7 | 100% |
| Rủi ro R1–R6 giải | 6 | 6 | 100% |
| Lead gate PASS | 1 | 1 | 100% |

---

## Đang ở đâu

- **Phase**: A — Architect ✅ ĐÓNG (lead gate PASS 2026-06-23)
- **Session kế tiếp**: — (Phase A xong → Phase B: planner soạn long-plan Schema + Migration)
- **Blocker**: không
- **Reference**: `ARCHITECTURE.md` §1–§7 đầy đủ; `../ROADMAP.md` Phase B

---

## Context nhanh cho architect khi bắt đầu Session A.1

**File cần đọc** (theo thứ tự ưu tiên):
1. `src/editor/extensions/NibBlock.ts` — schema hiện tại (addAttributes, parseDOM, toDOM)
2. `src/editor/NibBlockView.tsx` — NodeView implementation, cách block dùng attrs + blockMeta
3. `src/editor/yBlockMeta.ts` — Y.Map side-channel structure (BlockMetaRecord type)
4. `src/components/Workspace.tsx` — cách YjsProvider + editor context wrap
5. `src/editor/geometry.ts` — lineIndex/xOffset calculation, layout geometry hiện tại
6. `src/components/MathField.tsx` — cách MathLive `<math-field>` được nhúng hiện tại
7. `plan/accounts-cloud-sync/phase-b-sync-engine/ARCHITECTURE.md` — Y.Doc structure đã thiết kế
8. `docs/feature.md §2, §2.5, §3, §5, §6` — free-caret mental model + PM trade-off

**Quyết định [LOCKED] cần tôn trọng**:
- Hướng C: row-based, math = inline atom, caret thật xuyên trang, gõ = INSERT.
- MathLive giữ WYSIWYG (R6) — không bypass.
- Bỏ 2 nút toolbar MathLive: ☰ menu + ⌨ virtual-keyboard (Phase D implement, nhưng thiết kế config bắt đầu từ A.1).
- KHÔNG xóa IndexedDB store cũ (R3 — migration an toàn).
- Stack [LOCKED] CLAUDE.md §3–§6 không thay đổi.

**Phân biệt vai**:
- Architect = HOW (schema cụ thể, event sequence, data flow) — đây là việc architect.
- Planner = WHAT (goals, gates) — file PLAN.md này.
- KHÔNG implement code (đó là editor-frontend / glue-packaging sau khi architect gate PASS).

---

## Per-session log

- **A.1 (2026-06-23)** — đọc toàn bộ source + thiết kế §1 PM Schema (doc(row*), row{id}, mathInline{id} atom, text+marks, result không-phải-node) + §2 Y.Doc/Whitespace (reuse blockMeta keyed atom-id, NEW rowMeta{blankBefore,indent}, whitespace virtual giải R1 với byte-level proof). Lead gate PASS.
- **A.2 (2026-06-23)** — §3 Migration (detect+convert vào store __v2+verify+fallback, CẤM deleteDatabase, test matrix 4 case) + §4 Dual-Caret (ghost Decoration.widget + handoff rAF né bug 9021) + §5 Insert (PM-default + gap-atom backspace KHÔNG merge) + §6 Arrow-Nav 2D (goalX) + §7 Vòng-lõi (MathLive WYSIWYG giữ + Tính target precedence + evalSelection). Lead gate PASS.
- **Rủi ro chuyển phase sau** (ghi ở ARCHITECTURE.md cuối): (1) WS room v2 versioning `${userId}:${docId}:v2` — Phase B/C BẮT BUỘC; (2) reconstruct latex đa-atom — Phase E; (3) spike MathLive inline setCaretPoint/position — Phase D ≤1 ngày.

---

## Lịch sử revision

| Date | Action | By |
|---|---|---|
| 2026-06-23 | Created | @planner (Task #2, team caret-input) |
