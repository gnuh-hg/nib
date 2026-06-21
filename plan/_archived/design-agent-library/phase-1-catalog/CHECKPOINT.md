# CHECKPOINT — Phase 1: Design-library catalog

> Sổ tay tiến độ Phase 1. Bất kỳ phiên Claude nào mới mở đều đọc file này TRƯỚC để biết đang ở đâu.

---

## ⚠️ Constraint reminder (ĐỌC ĐẦU MỖI CHAT)

- Mỗi chat **chỉ làm 1 session** (xem "Đang ở đâu" để biết session nào).
- **STOP NGAY** khi đạt STOP gate của session — không tham làm session kế dù còn quota.
- **TRƯỚC khi đóng chat:** cập nhật bảng tiến độ + "Đang ở đâu" + thêm 1 entry "Per-session log".
- **Phase 1 chỉ tạo file trong `.claude/design-library/`** — KHÔNG ghi `src/`, KHÔNG tạo agent/skill/artifact HTML.
- **`src/styles/tokens.css` là nguồn chân lý — KHÔNG sửa** trong suốt Phase 1 (stale-catalog risk). Nếu tokens.css bị thay đổi giữa chừng → STOP và báo lead.
- **Executor:** team-ops. Không nhầm vai với planner (plan only).
- **3 quyết định LOCKED (project-level, không đảo):** (1) output agent = HTML in-repo; (2) thư viện = `.claude/design-library/`; (3) retire design-figma, roster 9 vai.

---

## Tiến độ tổng quan

| Hạng mục | Mục tiêu | Hiện tại | % |
|---|---|---|---|
| Session hoàn thành | 3 | 0 | 0% |
| Artifact `.claude/design-library/` | ≥5 | 0 | 0% |
| Token count ≥ tokens.css | pass | chưa đo | — |
| Component class grep pass | ≥5 | 0 | 0% |
| Pattern file | ≥3 | 0 | 0% |
| Snippet file | ≥3 | 0 | 0% |
| Grep hex rời toàn thư viện = 0 | pass | chưa đo | — |

---

## Đang ở đâu

- **Phase:** 1
- **Session kế tiếp:** 1.1 — INDEX.md + tokens.md
- **Blocker:** CC-1 — xác nhận `src/styles/tokens.css` freeze với lead trước khi bắt đầu
- **Reference:** `PLAN.md` → Session 1.1

---

## Per-session log

*(Chưa có session nào hoàn thành)*

---

## Lịch sử revision

| Date | Action | By |
|---|---|---|
| 2026-06-19 | Created | @planner |
