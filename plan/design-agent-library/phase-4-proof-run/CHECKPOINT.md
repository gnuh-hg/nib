# CHECKPOINT — Phase 4: Proof Run

> Sổ tay tiến độ. Bất kỳ phiên Claude nào mới mở đều đọc file này TRƯỚC để biết đang ở đâu.

---

## ⚠️ Constraint reminder (ĐỌC ĐẦU MỖI CHAT)

- Mỗi chat **chỉ làm 1 session** (xem "Đang ở đâu" để biết session nào).
- **STOP NGAY** khi đạt STOP gate của session — không tham làm thêm.
- **Executor = agent `design`** (subagent_type `design`, KHÔNG phải team-ops, KHÔNG phải editor-frontend). Lead spawn agent `design`, không tự code.
- **KHÔNG ghi `src/`, `backend/`, `src-tauri/`** — chỉ đọc src/ để hiểu class/key. Output DUY NHẤT = `docs/design-artifacts/settings-overlay.html`.
- **KHÔNG dùng Figma MCP** — agent `design` = code-native, output HTML/CSS thuần.
- **Prerequisite**: `docs/design-artifacts/` chưa tồn tại → agent Write tool tự tạo.
- **TRƯỚC khi đóng chat**: cập nhật bảng tiến độ + "Đang ở đâu" + thêm 1 entry "Per-session log".

---

## Tiến độ tổng quan

| Hạng mục | Mục tiêu | Hiện tại | % |
| --- | --- | --- | --- |
| Sessions hoàn thành | 1 | 0 | 0% |
| DC pass (done-criteria) | 6/6 | — | — |
| Artifact tồn tại | 1 file | 0 | 0% |

---

## Đang ở đâu

- **Phase**: 4 — Proof Run
- **Session kế tiếp**: 4.1 — Agent `design` đọc design-library → dựng `docs/design-artifacts/settings-overlay.html` → self-verify 6 DC bằng Bash → report cho lead
- **Blocker**: —
- **Reference**: `PLAN.md` Phase 4 → Session 4.1

---

## Per-session log

*(chưa có — Session 4.1 chưa chạy)*

---

## Lịch sử revision

| Date | Action | By |
| --- | --- | --- |
| 2026-06-20 | Created | @planner |
