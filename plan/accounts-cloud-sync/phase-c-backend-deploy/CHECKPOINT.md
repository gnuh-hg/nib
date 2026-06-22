# CHECKPOINT — Phase C: Backend Deploy (Hocuspocus + Supabase)

> Sổ tay tiến độ dài hạn. Bất kỳ phiên Claude nào mới mở đều đọc file này TRƯỚC để biết đang ở đâu.

---

## ⚠️ Constraint reminder (ĐỌC ĐẦU MỖI CHAT)

- Mỗi chat **chỉ làm 1 session** (xem "Đang ở đâu" để biết session nào).
- **STOP NGAY** khi đạt STOP gate của session đó — không tham làm session kế dù còn quota.
- **TRƯỚC khi đóng chat**: cập nhật bảng tiến độ + "Đang ở đâu" + thêm 1 entry "Per-session log".
- **HUMAN GATE (C.HG-A + C.HG-B)**: không phải session code — user tự làm trên web Supabase/Render. Chờ user xác nhận STOP gate rõ ràng trước khi agent tiếp session code kế.
- **Phụ thuộc phải đủ trước khi bắt đầu C.3**: C.HG-A pass (tables exist) + C.HG-B pass (health 200) + user có `wss://<render-url>`.
- **Stack [LOCKED]**: không đề xuất trả phí Render; không thay Hocuspocus/Supabase; SymPy sidecar không liên quan.

---

## Tiến độ tổng quan

| Hạng mục | Mục tiêu | Hiện tại | % |
| --- | --- | --- | --- |
| Sessions CODE hoàn thành | 3 | 3 (C.1, C.2, C.3) | 100% |
| Human gates pass | 2 | 2 (C.HG-A, C.HG-B) | 100% |
| Gate vàng (2-browser sync thật qua Render) | 1 | 🟡 connect+auth PROVEN; store/2-tab chờ user gõ bàn phím thật | — |

---

## Đang ở đâu

- **Phase**: C — Backend Deploy — code + deploy XONG. Chỉ còn gate vàng (user smoke).
- **Backend LIVE**: Render `https://nib-2bdn.onrender.com` (/health=200, commit JWKS). Supabase project `nib` ref `jgceboqufrnatgkjuqiv`.
- **Session kế tiếp**: GATE VÀNG (user) — điền `VITE_SUPABASE_ANON_KEY` vào `.env.local`, restart dev, signup/login, 2 tab sync test. URL đã set sẵn `.env.local`. Sau gate vàng PASS → Phase D (UI polish).
- **Blocker**: cần user login Supabase (lead không nhập mật khẩu) + điền anon key.
- **Reference**: `PLAN.md` Phase C → C.3 gate vàng; `ARCHITECTURE.md` (W1/W2; E4 nay = JWKS).

---

## Thứ tự session

```
C.1 [CODE]      → C.2 [CODE]      → C.HG-A [HUMAN]     → C.HG-B [HUMAN]     → C.3 [CODE + gate vàng]
Server scaffold   Persistence +      Supabase setup         Render deploy          Client wire +
+ onAuthenticate  compaction +       (tables + env)         + health verify        gate vàng 2-browser
                  schema.sql
```

---

## Per-session log

- **C.1 [CODE] — 2026-06-22 (editor-frontend, gate PASS):** Tạo `server/` (package.json, tsconfig.json, Dockerfile, .gitignore, src/index.ts, src/env.ts) + `.env.example` append block server env. `tsc --noEmit` exit 0; `curl localhost:3000/health` = 200; onAuthenticate (JWT verify + room R5 + sub guard) + onRequest health cùng port (W1), `process.env.PORT` không hardcode. **Lệch:** @hocuspocus/server 4.3.0 đổi API → dùng `new Server({...})` thay `Server.configure` (ghi mistakes.md). onRequest fire OK, không cần fallback E1.
- **C.2 [CODE] — 2026-06-22 (editor-frontend, gate PASS):** `server/src/persistence.ts` (onLoadDocument/onStoreDocument + compaction lock E2) + `server/src/schema.sql` (2 bảng TEXT base64, W2, RLS) + wire vào index.ts. `tsc --noEmit` exit 0; schema 2 table 0 bytea; mergeUpdates×2; requireEnv×2; lock `Map<string,boolean>`. Không kết nối DB thật (theo brief). Không lệch mới.
- **C.HG-A [HUMAN] — 2026-06-22 (lead+user qua Chrome, PASS):** Supabase project `nib` (ref `jgceboqufrnatgkjuqiv`, region Sydney ap-southeast-2). Chạy schema.sql trong SQL Editor (Success) → 2 bảng `yjs_updates`+`yjs_snapshots` visible Table Editor. `SUPABASE_URL=https://jgceboqufrnatgkjuqiv.supabase.co`.
- **PIVOT JWT — 2026-06-22 (Task #20, editor-frontend, gate PASS):** Phát hiện project mới ký token bằng **ECC P-256 (asymmetric JWT signing key)**, KHÔNG phải HS256 legacy secret. → Đổi `onAuthenticate` từ HS256 `jwt.verify(secret)` sang **JWKS asymmetric** (`jose` createRemoteJWKSet + jwtVerify, endpoint `${SUPABASE_URL}/auth/v1/.well-known/jwks.json` public). **Bỏ env `SUPABASE_JWT_SECRET`** (không cần nữa). tsc 0, smoke /health 200. Cập nhật E4 ARCHITECTURE: verify giờ là JWKS, không HS256. Commit `77c9a88`.
- **C.HG-B [HUMAN] — 2026-06-22 (lead+user qua Chrome, PASS):** Render Web Service `nib` (srv `srv-d8s6kf0js32c73cosfe0`), deploy từ PUBLIC repo `gnuh-hg/nib` (account Render khác account GitHub → dùng Public Git Repo tab; repo public). Root `server`, Node, Build `npm install; npm run build`, Start `node dist/index.js`, Free, Singapore. Env: SUPABASE_URL, SUPABASE_SERVICE_KEY, PORT=3000 (SUPABASE_JWT_SECRET bỏ). LIVE: `https://nib-2bdn.onrender.com`, `/health`=200 (verified curl), JWKS endpoint 200. Lưu ý: public-repo → KHÔNG auto-deploy on push, phải Manual Deploy.
- **C.3 [CODE] — 2026-06-22 (Task #21, editor-frontend, gate PASS):** `.env.local` (VITE_HOCUSPOCUS_URL=wss://nib-2bdn.onrender.com, gitignored) + `.env.example` comment + `server/src/README.md`. `npm run build` 0, tsc 0, vitest 87/87.
- **Gate vàng debug — 2026-06-22 (lead+user qua Chrome):** Human-gate Supabase auth: project mới mặc định bật Confirm email → tắt trong Auth→Sign In/Providers→Email + manual confirm user `nmhung29042009@gmail.com` qua SQL `update auth.users set email_confirmed_at=now()`. Anon key = publishable key mới `sb_publishable_...` (supabase-js 2.108 hỗ trợ).
- **BUG client + FIX — 2026-06-22 (Task #22 log + Task #23 fix, gate PASS):** Sync không chạy dù URL/token đúng. Thêm server logging (Task #22, commit 7f18300) → redeploy Render → thấy KHÔNG có `[conn]`. Root cause (Task #23, commit d9d9062): `src/lib/yProvider.ts` truyền `websocketProvider` thủ công → @hocuspocus/provider 4.3 để `manageSocket=false` → constructor KHÔNG gọi `attach()` → socket không mở. Fix: truyền `url` thẳng vào HocuspocusProvider (manageSocket=true → tự attach+connect; reconnect default lib trùng giá trị cũ). Sau fix + redeploy + warm server: Render logs xác nhận `[conn] connect room=<uid>:doc-calc-3` + `[auth] OK user=<uid>` + `[load]` → **WS connect + JWKS ES256 auth + room R5 PROVEN**.
- **CÒN LẠI (user keyboard smoke):** `[store]` khi edit + sync 2 tab — chưa quan sát được vì MathLive không nhận input qua browser-automation (cần bàn phím thật). Pipeline đã thông nên kỳ vọng chạy. Lead đã điền VITE_SUPABASE_URL/ANON_KEY vào .env.local; dev server :1420 đang chạy bản fix.
- **DIAGNOSIS sâu — 2026-06-22 (Task #24 __nibDebug + lead console probe):** Expose window.__nibDebug (dev-only, CHƯA commit) rồi soi runtime. Kết quả: fragment CÓ 2 node (editor bind đúng, sameFragment=true), token ES256 hợp lệ (còn hạn 42'), server log `[auth] OK`+`[load]` đều mỗi ~33s. NHƯNG client `provider.synced=false`, `messageReconnectTimeout` (30s) fire liên tục, 0 event `authenticated/synced/message`. **ROOT CAUSE: server→client WS frame KHÔNG tới client** (client→server OK qua server log) → sync handshake không xong → không đẩy doc → không `[store]` → không persist. Nghi Render free tier chặn/buffer frame server-initiated (KHÔNG phải bug logic). **Bước quyết định kế: isolation test — chạy hocuspocus LOCAL (ws://localhost:1234) trỏ client vào → nếu sync OK local mà fail Render = lỗi Render free WS; nếu fail cả local = lỗi protocol/code.** __nibDebug + Task #22 server logging cần gỡ sau khi xong.

---

## Lịch sử revision

| Date | Action | By |
| --- | --- | --- |
| 2026-06-22 | Created from `PLAN.md` Phase C | @planner |
| 2026-06-22 | C.1 + C.2 done (gate PASS); ARCHITECTURE.md filed; tới human-gate | @team-lead |
