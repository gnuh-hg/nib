# CHECKPOINT — Settings Redesign

> Sổ tay tiến độ dài hạn. Bất kỳ phiên Claude nào mới mở đều đọc file này TRƯỚC để biết đang ở đâu.

---

## ⚠️ Constraint reminder (ĐỌC ĐẦU MỖI CHAT)

- Mỗi chat **chỉ làm 1 session** (xem "Đang ở đâu" để biết session nào).
- **STOP NGAY** khi đạt STOP gate của session đó — không tham làm session kế dù còn quota.
- **TRƯỚC khi đóng chat**: cập nhật bảng tiến độ + "Đang ở đâu" + thêm 1 entry "Per-session log".
- **Quyết định LOCKED** (không bàn ngược):
  - Container = card nổi giống LibraryOverlay (scrim + header Back+tiêu đề, giữ canvas mounted)
  - Section registry extensible — thêm section chỉ push mảng, không refactor shell
  - Account = **ProfileProvider MỚI** (editable local profile, persist `nib-profile`, initials auto-gen), KHÔNG phải mock static
  - `avatarImage?` chừa slot cho post-MVP — **không implement upload ở MVP**
  - Nhóm MVP: "Tài khoản" + "Giao diện" (= Language + Theme gộp)
  - design-figma dựng 2–3 hướng visual, **KHÔNG tự chốt bố cục**
  - i18n en/vi parity · 0 hex rời · runtime no-reload
- **Rủi ro cần nhớ**:
  - R3 (props phình như LibraryOverlay): group props / SettingsContext từ S2.1
  - R4 (i18n key vi.json TS không bắt thiếu): grep parity sau mỗi session
  - R5 (clamp floating ghi mistakes.md): tính vị trí popover trong panel phải clamp theo bounds panel, không viewport
  - R6 (ProfileProvider mount order): phải mount cùng tầng ThemeProvider/I18nProvider — sai thứ tự → context undefined

---

## Tiến độ tổng quan

| Hạng mục | Mục tiêu | Hiện tại | % |
|---|---|---|---|
| Sessions hoàn thành | 4 (S1.1×2 song song + S2.1 + S2.2 + S2.3) | 0 | 0% |
| Phase 1 gate PASS | architect PASS + design-figma PASS | — | — |
| ProfileProvider build | 1 (S2.1) | 0 | 0% |
| Section MVP build | 2 (Account + Appearance) | 0 | 0% |
| i18n parity `settings.*` | en == vi (15 key) | — | — |
| Gate tsc 0 + build 0 | mỗi session cuối | — | — |
| Vitest không break | ≥56 + test mới pass | — | — |
| 0 hex rời SettingsOverlay/ + ProfileProvider/ | grep rỗng | — | — |

---

## Đang ở đâu

- **Phase**: 1
- **Session kế tiếp**: 1.1 — architect HOW ∥ design-figma visual (song song, lead relay 2 task)
- **Blocker**: Phase 1 gate (architect + design-figma) phải PASS trước khi Phase 2 bắt đầu.
- **Reference**: `PLAN.md` Phase 1 → Session 1.1

---

## Per-session log

_(chưa có session nào chạy)_

---

## Lịch sử revision

| Date | Action | By |
|---|---|---|
| 2026-06-19 | Created (initial draft) | @planner |
| 2026-06-19 | Rev 1: Cập nhật theo Task #2 brief — đảo Account mock → ProfileProvider editable; thêm §nhóm MVP, §registry, §data model, §i18n keys; cập nhật constraint reminder + rủi ro R5/R6 | @planner |
