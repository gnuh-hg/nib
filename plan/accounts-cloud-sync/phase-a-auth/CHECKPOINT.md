# CHECKPOINT — Phase A: Auth

> Sổ tay tiến độ. Bất kỳ phiên Claude nào mới mở đều đọc file này TRƯỚC để biết đang ở đâu.

---

## ⚠️ Constraint reminder (ĐỌC ĐẦU MỖI CHAT)

- Mỗi chat **chỉ làm 1 session** (xem "Đang ở đâu" để biết session nào).
- **STOP NGAY** khi đạt STOP gate của session đó — không tham làm session kế dù còn quota.
- **TRƯỚC khi đóng chat**: cập nhật bảng tiến độ + "Đang ở đâu" + thêm 1 entry "Per-session log".
- **CC-4 BLOCK**: Session A.2 **KHÔNG tiến hành** cho đến khi CC-4 (keyring plugin choice) được lead/architect/user chốt và ghi rõ trong brief. Nếu gặp Session A.2 mà brief không nêu CC-4 → báo lead ngay, dừng.
- **Không đụng SymPy sidecar** — `backend/` là out of scope của Phase A.

---

## Tiến độ tổng quan

| Hạng mục | Mục tiêu | Hiện tại | % |
|---|---|---|---|
| Sessions hoàn thành | 3 | 0 | 0% |
| Gate pass | 3/3 | — | — |
| Files tạo mới | ~10 | 0 | 0% |
| i18n keys auth.* | ~7 | 0 | 0% |

---

## Đang ở đâu

- **Phase**: A
- **Session kế tiếp**: A.1 — Supabase client + auth module
- **Blocker**: CC-4 chưa chốt (keyring plugin) — chặn Session A.2, **KHÔNG chặn A.1**
- **Reference**: `PLAN.md` Phase A → Session A.1

---

## Per-session log

(chưa có — chờ Session A.1)

---

## Lịch sử revision

| Date | Action | By |
|---|---|---|
| 2026-06-21 | Created from PLAN.md | @planner |
