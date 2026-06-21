# Nib — Accounts + Cloud Sync Roadmap

> Bản đồ chia workstream "Accounts + Cloud Sync" thành các phase độc lập. **Mỗi phase = 1 long-plan** soạn riêng khi user yêu cầu (nested dưới thư mục này). File này chỉ mô tả *cần làm gì* + *cần làm rõ gì* — KHÔNG chia session (đó là việc `plan-long` từng phase).

---

## ⚠️ Đảo [LOCKED] — spec 2026-06-19

`context.md` 2026-06-19 ghi: **"Account = UI-ONLY local profile, KHÔNG auth/login/backend"** (settings-redesign session). User chốt lại **2026-06-21 hướng C**: account thật + cloud sync cả tài liệu toán. **Đây là thay đổi spec có chủ đích — KHÔNG phải mở rộng tự nhiên.** Mọi plan/code liên quan phải bám quyết định mới này. (Chốt bởi user 2026-06-21.)

---

## Nền tảng đã chốt (không bàn lại)

- Stack **[LOCKED]** từ `CLAUDE.md` §3–§6: Tauri 2 + React/TS/Vite + TipTap (ProseMirror) + SymPy sidecar LOCAL offline.
- **SymPy sidecar KHÔNG thay đổi** — vẫn offline-only; cloud sync KHÔNG đụng đến sidecar.
- **Sync engine: Yjs (CRDT)** — KHÔNG phải LWW. Lý do: offline-first [LOCKED]; 1 user nhiều máy có thể cùng offline sửa → merge phải an toàn; tái dùng `y-prosemirror` của TipTap. **[LOCKED]**
- **Kết quả CAS (exact/approx LaTeX) = phần của block/doc**, persist + sync CÙNG block — KHÔNG tách riêng, KHÔNG re-compute-on-open. **[LOCKED]**
- **Backend**: Supabase (auth + Postgres lưu Yjs update/snapshot) + Hocuspocus (MIT, self-host Yjs WebSocket server) deploy Render. [path khuyến nghị — architect phase B/C chốt cuối]

---

## Cross-cutting — cần chốt trước khi vào phase liên quan

| # | Nội dung | Ảnh hưởng | Trạng thái |
|---|---|---|---|
| CC-1 | **y-prosemirror node-attrs bug**: block Nib lưu `xOffset`/`lineIndex`/kết quả CAS là node attributes → bug đã biết attrs không sync đúng qua Yjs → phải chọn cách lưu (node attr vs XmlMap/Map riêng trong Yjs doc). Đây là câu hỏi HOW chặn architect Phase B. | Chặn Phase B architect | ⬜ |
| CC-2 | **Hocuspocus Render tier**: free spin-down (~15 phút idle) → WebSocket drop khi cold-start; paid ~$7/mo loại bỏ spin-down. Ngân sách? | Chặn Phase C deploy | ⬜ |
| CC-3 | **Snapshot/update-stream Postgres**: Yjs update stream append-only → phình Postgres nhanh với tài liệu toán nhiều edit; cần chiến lược merge snapshot định kỳ hoặc compact on-save. | Chặn Phase C schema design | ⬜ |
| CC-4 | **Tauri keyring plugin**: `tauri-plugin-stronghold` vs `tauri-plugin-keychain` vs OS keyring native (GNOME Keyring qua D-Bus trên Linux) + fallback khi không có keyring daemon. | Chặn Phase A Session A.2 | ⬜ |

---

## Các phase

### Phase A — Auth

- **Cần làm gì (WHAT)**:
  - Tích hợp `@supabase/supabase-js` auth vào Tauri app
  - Lưu JWT token an toàn trên máy (GNOME Keyring / fallback) qua Tauri plugin (CC-4)
  - Migrate `ProfileProvider` từ localStorage-only → Supabase user thật
  - `LoginModal` UI (email + password, OAuth placeholder)
  - Wire AccountChip trong dock → login/logout flow
- **Cần làm rõ trước**: CC-4 (keyring plugin) — chặn Session A.2; architect pha này hoặc lead/user quyết trước khi implement
- **Done khi**: `npm run build` + `tsc --noEmit` + vitest pass; login flow UI hiển thị trong app Tauri; `supabase.auth.getSession()` có thể trả real user; token persist qua app restart; ProfileProvider phản ánh Supabase user
- **Phụ thuộc**: không

### Phase B — Sync Engine

- **Cần làm gì (WHAT)**:
  - Setup Yjs doc model ánh xạ TipTap/ProseMirror document
  - Chiến lược lưu block attrs (`xOffset`, `lineIndex`, kết quả CAS) trong Yjs theo CC-1 (KHÔNG dùng node attr thô — xem rủi ro)
  - `y-indexeddb` persistence offline-first
  - `y-prosemirror` binding với TipTap editor
  - Hocuspocus WebSocket client (reconnect logic, offline queue)
  - Kết quả CAS lưu trong Yjs Map của từng block (LOCKED — không tách riêng)
- **Cần làm rõ trước**: **CC-1 (node-attrs strategy) — PHẢI chốt HOW trước khi architect thiết kế; đây là rủi ro kỹ thuật then chốt của cả workstream.** Nếu bỏ qua, block Nib sẽ dồn về x=0 khi mở trên máy khác.
- **Done khi**: `npm run build` + `tsc --noEmit` pass; 1 doc sync được giữa 2 tab/cửa sổ offline-first qua Hocuspocus local; block attrs (xOffset, kết quả CAS) đồng bộ đúng không bị reset về default
- **Phụ thuộc**: Phase A done

### Phase C — Backend Deploy

- **Cần làm gì (WHAT)**:
  - Hocuspocus server config + deploy script (Render)
  - Supabase Postgres schema cho Yjs updates + snapshots (CC-3)
  - Hocuspocus persistence hook → ghi Yjs update vào Supabase
  - Snapshot merge job định kỳ (tránh phình row)
- **Cần làm rõ trước**: CC-2 (Render tier) + CC-3 (snapshot strategy); **HUMAN GATE bắt buộc**: user setup Supabase project (schema, RLS) + Render service (có thể dùng Claude Chrome vào web Supabase/Render đã đăng nhập)
- **Done khi**: Hocuspocus app running trên Render (health endpoint `/` hoặc `/health` pass); Supabase table `yjs_updates` nhận được document update từ client thật; snapshot merge job chạy không lỗi (log sạch)
- **Phụ thuộc**: Phase B done + CC-2 + CC-3 chốt + human gate Supabase/Render setup

### Phase D — UI / Polish

- **Cần làm gì (WHAT)**:
  - Sync status indicator (online / syncing / offline / error) trong UI
  - Account section trong SettingsOverlay (avatar, tên, email, logout)
  - Offline badge khi không kết nối được Hocuspocus
  - Error states (auth expired → auto-redirect login, sync conflict notice)
- **Cần làm rõ trước**: UX conflict states — Yjs CRDT tự merge nhưng cần quyết định: có thông báo "đang đồng bộ" không? badge ở đâu (TopStrip / dock)?
- **Done khi**: `npm run build` + `tsc --noEmit` + vitest pass; badge online/offline hiển thị đúng trạng thái WS; logout → clear ProfileProvider + Yjs doc local + đóng WS; 0 hex rời ngoài tokens
- **Phụ thuộc**: Phase C done (WS endpoint sống)

---

## Thứ tự phụ thuộc

```
CC-4 chốt (keyring)
      │
      ▼
Phase A — Auth
      │
      ▼
CC-1 chốt (node-attrs strategy) → architect Phase B
      │
      ▼
Phase B — Sync Engine
      │
      ▼
CC-2 + CC-3 chốt + HUMAN GATE (Supabase schema + Render deploy)
      │
      ▼
Phase C — Backend Deploy
      │
      ▼
Phase D — UI / Polish
```

---

## Cách dùng file này

Mỗi lần build 1 phase: user trỏ vào phase → dùng `plan-long` dựng `plan/accounts-cloud-sync/<phase-slug>/PLAN.md` + `CHECKPOINT.md` (nested dưới thư mục này), chốt phần "cần làm rõ" của phase đó trước rồi mới chia session. Cập nhật bảng dưới khi phase xong.

| Phase | Long-plan | Trạng thái |
|---|---|---|
| Cross-cutting CC-1..CC-4 | — | ⬜ |
| A — Auth | `plan/accounts-cloud-sync/phase-a-auth/` | 🔄 |
| B — Sync Engine | `plan/accounts-cloud-sync/phase-b-sync-engine/` | 🔄 |
| C — Backend Deploy | `plan/accounts-cloud-sync/phase-c-backend-deploy/` | ⬜ |
| D — UI / Polish | `plan/accounts-cloud-sync/phase-d-ui-polish/` | ⬜ |
