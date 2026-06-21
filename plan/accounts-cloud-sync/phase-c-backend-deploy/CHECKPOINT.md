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
| Sessions CODE hoàn thành | 3 | 2 (C.1, C.2) | 67% |
| Human gates pass | 2 | 0 | 0% |
| Gate vàng (2-browser sync thật qua Render) | 1 | — | — |

---

## Đang ở đâu

- **Phase**: C — Backend Deploy
- **Session kế tiếp**: C.HG-A [HUMAN GATE] — user setup Supabase project (chạy `server/src/schema.sql`, lấy 3 env: URL/SERVICE_KEY/JWT_SECRET). Sau đó C.HG-B (Render deploy) → C.3 (client wire + gate vàng).
- **Blocker**: Human gate — chờ user vào Supabase/Render. C.HG-B cần `server/` đã push lên GitHub trước (Render deploy từ repo).
- **Reference**: `PLAN.md` Phase C → Session C.HG-A; `ARCHITECTURE.md` (HOW C.1/C.2 + W1/W2 đã giải).

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
- **PIVOT JWT — 2026-06-22 (Task #20, editor-frontend, gate PASS):** Phát hiện project mới ký token bằng **ECC P-256 (asymmetric JWT signing key)**, KHÔNG phải HS256 legacy secret. → Đổi `onAuthenticate` từ HS256 `jwt.verify(secret)` sang **JWKS asymmetric** (`jose` createRemoteJWKSet + jwtVerify, endpoint `${SUPABASE_URL}/auth/v1/.well-known/jwks.json` public). **Bỏ env `SUPABASE_JWT_SECRET`** (không cần nữa). tsc 0, smoke /health 200. Cập nhật E4 ARCHITECTURE: verify giờ là JWKS, không HS256.

---

## Lịch sử revision

| Date | Action | By |
| --- | --- | --- |
| 2026-06-22 | Created from `PLAN.md` Phase C | @planner |
| 2026-06-22 | C.1 + C.2 done (gate PASS); ARCHITECTURE.md filed; tới human-gate | @team-lead |
