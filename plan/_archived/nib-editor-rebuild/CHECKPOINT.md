# CHECKPOINT — Nib Editor Rebuild (khớp design HTML)

> Sổ tay tiến độ dài hạn. Bất kỳ phiên Claude nào mới mở đều đọc file này TRƯỚC để biết đang ở đâu.

---

## ⚠️ Constraint reminder (ĐỌC ĐẦU MỖI CHAT)

- Mỗi chat **chỉ làm 1 session** (xem "Đang ở đâu" để biết session nào).
- **STOP NGAY** khi đạt STOP gate của session đó — không tham làm session kế dù còn quota.
- **TRƯỚC khi đóng chat**: cập nhật bảng tiến độ + "Đang ở đâu" + thêm 1 entry "Per-session log".
- **Design HTML thắng tuyệt đối**: `/home/gnuh/Downloads/Nib Editor.dc.html` là nguồn chân lý — không tự diễn giải.
- **KHÔNG đụng UnifiedDock** (Vùng 5 — đã khớp design).
- **Token-driven**: cấm thêm hex literal. Mọi màu phải dùng CSS custom property.
- **i18n**: mọi text string mới phải có key trong `en.json` + `vi.json`.
- **Landscape-only**: drop hỗ trợ portrait + sub-compact 820px (user chốt 2026-06-17).
- **Vòng lõi** "gõ 1 block → kết quả symbolic mock inline live" KHÔNG được vỡ sau bất kỳ session nào.
- **xOffset tính từ PAPER-left**, không canvas-left (geometry.ts) — architect chốt HOW.

---

## Tiến độ tổng quan

| Hạng mục | Mục tiêu | Hiện tại | % |
|---|---|---|---|
| Sessions hoàn thành | 5 (+1 restructure) | 6 | 100% |
| Vùng UI khớp design | 5 (tokens/header/canvas/rail/library) | 5 | 100% |
| Token đúng/đủ | 3 mới + 7 sửa | 3 mới + 7 sửa | ✓ |
| Gate pass (build+tsc+vitest) | 5/5 session | 6/6 | 100% |

---

## Đang ở đâu

- **Phase**: 1 — **HOÀN THÀNH** (mọi session PASS, lead verify độc lập: tsc 0 / build ✓ / vitest 53/53 / 0 hex rời).
- **Session kế tiếp**: — (không còn; plan xong)
- **CÒN TREO**: browser smoke chỉ USER chạy được (Chrome ext không connect ở agent) — `npm run dev` :1420 kiểm vòng lõi + library + rail + header full-width. Xem memory/context.md entry 2026-06-17 mục "CÒN TREO".
- **Reference**: `PLAN.md` Phase 1 (mọi session done)

---

## Per-session log

- **S1.1 tokens** — PASS: +3 token (--desk/--sheet-shadow/--scrim) + sửa 7 token + requirements §2 landscape-only. tsc0/build0/vitest 50/50.
- **S1.2 header** — PASS: rail-toggle (IconLayoutSidebar) + bỏ virtual-keyboard + railOpen state. 50/50.
- **S1.3 canvas/paper** — PASS (rủi ro cao): desk+paper 664 + margin-line/page-title/selection-overlay/hint-pill; geometry ref→paperRef; nib-editor-host relative+min-height; +canvasLayout.test.ts. vitest 53/53 (RISK#1 top=192px, RISK#2 offsetParent=nib-pm).
- **S1.4 sidebar rail** — PASS: SidebarRail width 256↔0 animate + doc list + footer; +doc.ts/mockDocs.ts. 53/53. Editor flag divergence R1 (header).
- **S1.4b restructure** — PASS: Workspace.tsx wrapper (header full-width top) + Canvas presentational; EditorContext.Provider bao Dock/Palette. 53/53.
- **S1.5 library overlay** — PASS: LibraryOverlay/ 10 file (scrim+panel+toolbar+cards+context-menu+delete-modal--error+sort+rename) + AppShell mutate handlers + 17 key library.* en+vi. 53/53.

---

## Lịch sử revision

| Date | Action | By |
|---|---|---|
| 2026-06-17 | Created from Task #2 | @planner |
| 2026-06-17 | Phase 1 hoàn thành — 6/6 session PASS (gồm S1.4b restructure) | @team-lead |
