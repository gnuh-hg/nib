# CHECKPOINT — Phase B: Sync Engine (Yjs/CRDT)

> Sổ tay tiến độ Phase B. Bất kỳ phiên Claude nào mới mở đều đọc file này TRƯỚC để biết đang ở đâu.

---

## ⚠️ Constraint reminder (ĐỌC ĐẦU MỖI CHAT)

- Mỗi chat **chỉ làm 1 session** (xem "Đang ở đâu" để biết session nào).
- **STOP NGAY** khi đạt STOP gate của session đó — không tham làm session kế dù còn quota.
- **TRƯỚC khi đóng chat**: cập nhật bảng tiến độ + "Đang ở đâu" + thêm 1 entry "Per-session log".
- **HOW đã xong** — mọi quyết định HOW lấy từ `ARCHITECTURE.md` cùng thư mục. **KHÔNG thiết kế lại CC-1/stack/module names**.
- **Session B.3 và B.5 là HEAVY** — đọc đủ source file (NibBlock.ts, NibBlockView.tsx cho B.3; Workspace.tsx cho B.5) trước khi viết. Không bỏ qua bước đọc.
- **R2 (NibHistory → yUndoPlugin):** xóa NibHistory PHẢI cùng session khi wire TopStrip undo (Session B.4). Không tách 2 session.
- **Gate vàng B.5:** Chrome ext không available ở background agent — nộp click-through checklist cho user smoke thay vì block.
- **Phase C boundary:** `yProvider.ts` PHẢI có comment `// Phase C: onAuthenticate JWT validate room ${userId}:${docId}`. Không implement onAuthenticate ở Phase B.

---

## Tiến độ tổng quan

| Hạng mục | Mục tiêu | Hiện tại | % |
|---|---|---|---|
| Sessions hoàn thành | 5 | 0 | 0% |
| File mới tạo | ~12 | 0 | 0% |
| File sửa đổi | ~7 | 0 | 0% |
| File xóa | 1 (NibHistory.ts) | 0 | 0% |
| Gate pass | 5/5 | 0/5 | 0% |
| Gate vàng (human smoke) | 1 | — | — |

---

## Đang ở đâu

- **Phase:** B
- **Session kế tiếp:** B.1 — Yjs core libs + YjsProvider (deps + 7 file mới)
- **Blocker:** Không (Phase A done, ARCHITECTURE.md gate PASS)
- **Reference:** `PLAN.md` Phase B → Session B.1

---

## Per-session log

*(Chưa có — Phase B chưa bắt đầu)*

---

## Lịch sử revision

| Date | Action | By |
|---|---|---|
| 2026-06-21 | Created from PLAN.md Phase B (Task #10) | @planner |
