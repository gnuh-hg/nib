# PLAN — Phase A: Auth

> Sau khi xong Phase A, Nib có thể: người dùng đăng nhập Supabase từ app Tauri, token lưu an toàn trên máy, ProfileProvider phản ánh real Supabase user thay vì localStorage local-only.

---

## Context

- **Workstream**: Accounts + Cloud Sync — `plan/accounts-cloud-sync/ROADMAP.md`.
- **Đảo [LOCKED] cũ**: "Account = UI-ONLY local profile, KHÔNG auth/login/backend" (settings-redesign 2026-06-19) → user chốt hướng C 2026-06-21: account thật. Phase này hiện thực hoá đảo chiều đó.
- **Chia nhiều session vì**:
  1. Tauri webview OAuth flow phức tạp hơn browser thuần (cần Tauri deep-link hoặc custom URI scheme cho callback).
  2. Keyring plugin cần `cargo build` + Rust dependency mới (CC-4 phải chốt trước Session A.2).
  3. ProfileProvider refactor chạm nhiều component đang hoạt động (dock AccountChip, SettingsOverlay).
- **Ràng buộc external**: CC-4 (keyring plugin) chưa chốt → **Session A.2 BLOCK** cho đến khi architect/lead/user quyết. Session A.1 không bị chặn.
- **Out of scope**: Yjs/CRDT (Phase B), backend deploy (Phase C), sync UI badge (Phase D), SymPy sidecar (không đổi).

---

## Pipeline 1 phase / 3 session

```
[Phase A — Auth]
  Session A.1 ──► supabase client + auth module (src/lib/supabase.ts + auth.ts)
       │
  Session A.2 ──► Tauri secure token storage (src/lib/tokenStore.ts + Rust plugin)
       │
  Session A.3 ──► ProfileProvider migration + LoginModal UI + i18n keys
       │
       └──► login flow hoạt động end-to-end trong app Tauri
```

---

## Phase A — Auth

**Mục tiêu**: người dùng đăng nhập Supabase email/password từ Tauri Nib, token lưu an toàn (GNOME Keyring / fallback), ProfileProvider phản ánh real Supabase user.

### Session A.1 — Supabase client + auth module

- **Scope**:
  - Cài `@supabase/supabase-js`; cấu hình env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) — tạo `.env.example`, thêm `.env.local` vào `.gitignore`
  - Tạo `src/lib/supabase.ts` — export `supabase` client singleton (đọc từ `import.meta.env`)
  - Tạo `src/lib/auth.ts` — export `signInWithEmail(email, password)`, `signOut()`, `getSession()`, `onAuthStateChange(callback)`
  - Đảm bảo vitest không gọi Supabase thật: mock `src/lib/supabase.ts` trong test env
- **STOP gate**: `npm run build` exit 0; `tsc --noEmit` 0 error; `src/lib/supabase.ts` + `src/lib/auth.ts` tồn tại với đúng exports; vitest pass (existing tests không vỡ, không có test mới gọi Supabase thật)
- **Output artifact**: `src/lib/supabase.ts`, `src/lib/auth.ts`, `.env.example`

### Session A.2 — Tauri secure token storage

> **⚠️ BLOCK nếu CC-4 chưa chốt.** Session này KHÔNG tiến hành cho đến khi lead/architect/user quyết keyring plugin. Báo lead ngay nếu brief không nêu CC-4 đã giải.

- **Scope**:
  - Tích hợp keyring plugin (CC-4 chốt → biết tên plugin cụ thể: ưu tiên `tauri-plugin-keychain` nếu cross-platform, hoặc `tauri-plugin-stronghold`)
  - Tạo `src/lib/tokenStore.ts`: `saveToken(token: string)`, `loadToken(): Promise<string | null>`, `clearToken()` — wrap plugin + fallback `localStorage`-based khi keyring daemon không khả dụng (Linux không có GNOME Keyring running)
  - Hook `onAuthStateChange` trong `src/lib/auth.ts` → gọi `saveToken` khi `SIGNED_IN`, `clearToken` khi `SIGNED_OUT`
  - Update `src-tauri/Cargo.toml` + `src-tauri/src/lib.rs` với plugin dependency + permission grant
- **STOP gate**: `cargo build` trong `src-tauri/` pass; `npm run build` exit 0; `tsc --noEmit` 0 error; `src/lib/tokenStore.ts` tồn tại với 3 exports kiểu đúng; token persist qua reload (manual smoke)
- **Output artifact**: `src/lib/tokenStore.ts`, `src-tauri/Cargo.toml` (updated), `src-tauri/src/lib.rs` (updated), `src-tauri/capabilities/` (permissions nếu cần)

### Session A.3 — ProfileProvider migration + LoginModal UI

- **Scope**:
  - Migrate `src/contexts/ProfileProvider.tsx`: khi app mount, gọi `getSession()` trước → nếu có session → lấy `user.email`/`user.id` làm base; `displayName` và `avatarColor` vẫn override được từ localStorage như cũ (pattern tương thích); nếu không có session → profile là `null` / guest state
  - Tạo `src/components/LoginModal/` (component + CSS + index): email input, password input, nút "Đăng nhập", error message display; nút "Đăng xuất" khi đã đăng nhập; Google OAuth button placeholder (disabled, không wire)
  - Wire AccountChip trong dock (`src/components/UnifiedDock/`): nếu `ProfileProvider.profile === null` → AccountChip click mở `LoginModal`; nếu có profile → hiển thị avatar initials + tooltip email; click mở menu với "Đăng xuất"
  - i18n keys mới (en + vi): `auth.signIn`, `auth.signOut`, `auth.email`, `auth.password`, `auth.errorInvalidCredentials`, `auth.errorNetwork`, `auth.loggedInAs`
- **STOP gate**: `npm run build` exit 0; `tsc --noEmit` 0 error; vitest pass (ProfileProvider test: session null → `profile === null`, session có user → `profile.displayName` reflect); LoginModal render không lỗi console; 0 hex rời ngoài tokens (`src/styles/tokens.css`); i18n parity en/vi (số key khớp)
- **Output artifact**: `src/contexts/ProfileProvider.tsx` (updated), `src/components/LoginModal/` (mới, ≥3 file), `src/locales/en.json` + `vi.json` (updated ~7 key)

**Phase A gate** (sau Session A.3 pass): `npm run build` + `tsc --noEmit` + vitest pass; login flow UI render trong app; khi có Supabase config thật `getSession()` trả real user; token persist qua app restart; ProfileProvider phản ánh Supabase user; `cargo build` pass.

---

## Outcome cuối (Phase A)

- Người dùng đăng nhập được Supabase email/password trong app Tauri Nib
- Token lưu an toàn trên máy, persist qua restart, clear khi logout
- ProfileProvider không còn localStorage-only — phản ánh Supabase user
- **Gate đo lường**: `npm run build` 0 error + `cargo build` pass + vitest pass + LoginModal render đúng + ProfileProvider reflect session

---

## Revision log

| Date | Change | Lý do |
|---|---|---|
| 2026-06-21 | Initial | Phase A của roadmap accounts-cloud-sync |
