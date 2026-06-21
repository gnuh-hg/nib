# PLAN — Phase C: Backend Deploy (Hocuspocus + Supabase)

> Sau khi xong Phase C: Hocuspocus WebSocket server tự host trên Render (free tier) + Supabase Postgres lưu Yjs update/snapshot theo chiến lược compaction CC-3; client Nib trỏ `VITE_HOCUSPOCUS_URL` vào server thật + auth JWT qua `onAuthenticate`; gate vàng: 2 máy/2 trình duyệt khác nhau login cùng account → sync doc toán đúng qua cloud.

---

## Context

- **Tại sao chia nhiều session:** Phase C có 2 nhóm deliverable tách biệt (code server / human-gate web-setup) cộng 2 session code nặng (server auth logic / persistence+compaction). Chia để tránh context overload (ISSUE-14) và human-gate chặn đúng chỗ.
- **Nền Phase B đã có (không đụng lại):**
  - `src/lib/yProvider.ts` — `createHocuspocusProvider`, room `${userId}:${docId}`, URL `import.meta.env.VITE_HOCUSPOCUS_URL`, reconnect backoff 1000ms×2/max 30 000 ms, comment `// Phase C: validate ${userId}:${docId} room in onAuthenticate`.
  - `src/lib/yPersistence.ts` — IndexedDB offline-first đã sẵn.
  - `src/lib/tokenStore.ts` + `src/lib/auth.ts` — Supabase `access_token` JWT có sẵn để gửi qua WS.
  - `@hocuspocus/server ^4.3.0` — đã cài (devDep Phase B, cần chuyển thành dep cho server sản xuất).
  - `.env.example` — đã có `VITE_HOCUSPOCUS_URL=ws://localhost:1234`.
- **CC-2 chốt (Render free tier):** User quyết "cứ dùng free tier" (2026-06-21). Hệ quả: spin-down ~15 phút idle → WS cold-start delay 10–30 giây. Client đã có reconnect backoff → sync buffer IndexedDB, tự merge khi WS khôi phục. **Plan KHÔNG đề xuất trả phí.**
- **CC-3 chốt (snapshot/compaction):** Table `yjs_updates` append-only + `yjs_snapshots` (latest full state per docId). Compaction trigger: mỗi 50 update/doc → `Y.mergeUpdates` vào snapshot + xóa update cũ → giữ Postgres footprint < 100 MB trong free tier 500 MB Supabase.
- **Stack [LOCKED]:** Tauri 2 + React/TS/Vite + TipTap/ProseMirror. Server: Node.js `@hocuspocus/server`, `@supabase/supabase-js`. SymPy sidecar = offline-only, không liên quan.
- **Out of scope Phase C:** cursor presence (Phase D); OAuth flow (Phase A done); SymPy sidecar; block model.
- **Phụ thuộc:** Phase A done (auth + tokenStore) + Phase B done (Yjs client + YjsProvider).

---

## Pipeline 1 phase / 5 session (3 CODE + 2 HUMAN GATE)

```
[C.1] [CODE]   Server scaffold + onAuthenticate ──────► server/index.ts + package.json + tsconfig.json + Dockerfile
                                                         .env.example (append server vars)
                                                         └─► STOP gate: cd server && npx tsc --noEmit → 0 error; onAuthenticate + room-parse grep pass

[C.2] [CODE]   Persistence + compaction + schema ─────► server/persistence.ts + server/env.ts + server/schema.sql
                                                         server/index.ts (wire persistence hooks)
                                                         └─► STOP gate: tsc --noEmit 0 error; schema 2 table; compaction grep pass; hooks wired

[C.HG-A] [HUMAN GATE]  Supabase project setup ────────► yjs_updates + yjs_snapshots tables tồn tại; 3 env values ready

[C.HG-B] [HUMAN GATE]  Render deploy + health ────────► GET https://<render-url>/health → 200 OK; logs clean

[C.3] [CODE]   Client wire + env + gate vàng ──────────► .env.example updated; yProvider.ts token path verified; server/README.md
                                                          └─► STOP gate: npm run build 0; tsc 0; gate vàng 2-browser sync thật qua Render
```

---

## Phase C — Backend Deploy

**Mục tiêu:** Dựng Hocuspocus Node.js server tự host trên Render free tier với JWT auth (`onAuthenticate` validate Supabase JWT + room format) + Supabase Postgres persistence (CC-3 compaction 50-update trigger); client Nib trỏ `VITE_HOCUSPOCUS_URL` vào server thật để sync doc giữa các thiết bị.

---

### Session C.1 [CODE] — Server scaffold + onAuthenticate

- **Scope (WHAT):**
  - Tạo thư mục `server/` tại root repo (ngang với `src/`, `src-tauri/`, `backend/`)
  - `server/package.json` — `name: "nib-hocuspocus-server"`, deps: `@hocuspocus/server@^4`, `@supabase/supabase-js@^2`, `jsonwebtoken@^9`; devDeps: `typescript@^5`, `ts-node@^10`, `@types/node@^22`, `@types/jsonwebtoken@^9`; scripts: `"start": "node dist/index.js"`, `"build": "tsc"`, `"dev": "ts-node src/index.ts"`
  - `server/tsconfig.json` — `target: "ES2022"`, `module: "commonjs"`, `outDir: "./dist"`, `rootDir: "./src"`, `strict: true`, `esModuleInterop: true`
  - `server/src/index.ts` — `import { Server } from "@hocuspocus/server"` + `import jwt from "jsonwebtoken"`:
    - Health HTTP server: `http.createServer` trả `200 OK` tại path `/health`
    - `Server.configure({ port: PORT, async onAuthenticate({ token, documentName }) { ... } }).listen()`
    - `onAuthenticate`:
      1. Verify `token` bằng `jwt.verify(token, process.env.SUPABASE_JWT_SECRET!)` → lấy `payload.sub` (userId Supabase)
      2. Parse `documentName` format `${userId}:${docId}` — split `:`, validate 2 part, `parts[0] === payload.sub` (R5 từ ARCHITECTURE.md Phase B)
      3. Throw `Error("unauthorized")` nếu verify fail / format sai / sub không khớp
  - `.env.example` (root repo, append dưới block `# Hocuspocus server env`): `SUPABASE_URL=`, `SUPABASE_SERVICE_KEY=`, `SUPABASE_JWT_SECRET=`, `PORT=3000`
  - `server/Dockerfile` — `FROM node:20-slim`, `WORKDIR /app`, COPY + `npm ci --production`, `CMD ["node", "dist/index.js"]`; expose 3000

- **STOP gate:**
  - `cd server && npm install && npx tsc --noEmit` → 0 error
  - `grep -n "onAuthenticate" server/src/index.ts` → ≥1 hit
  - `grep -n "payload.sub\|parts\[0\]" server/src/index.ts` → ≥2 hits (room validate)
  - `grep -n "/health" server/src/index.ts` → ≥1 hit (health endpoint)
  - `server/Dockerfile` tồn tại
  - `.env.example` chứa `SUPABASE_JWT_SECRET`

- **Output artifact:** `server/` directory; `server/package.json`, `server/tsconfig.json`, `server/src/index.ts`, `server/Dockerfile`; `.env.example` (modify, append)

---

### Session C.2 [CODE] — Persistence hook + compaction + schema SQL

- **Scope (WHAT):**
  - `server/src/env.ts` — helper `requireEnv(key: string): string` throw `Error` nếu không có (fail-fast)
  - `server/src/persistence.ts`:
    - Khởi tạo Supabase client: `createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_KEY"))`
    - `onLoadDocument({ documentName }): Promise<Uint8Array>` — load từ `yjs_snapshots` (latest) + `yjs_updates` (created_at > snapshot.created_at); merge bằng `Y.mergeUpdates([snapshot.snapshot_data, ...updates.map(r => r.update_data)])`; return merged binary; trả `new Uint8Array(0)` nếu không có gì
    - `onStoreDocument({ documentName, document }): Promise<void>` — `Y.encodeStateAsUpdate(document)` → insert row vào `yjs_updates`; sau đó trigger compaction nếu count > 50 cho docId: `select count(*) from yjs_updates where doc_id = ?` → nếu >50: `Y.mergeUpdates(all_updates)` → `upsert yjs_snapshots` → `delete yjs_updates where doc_id = ?`
  - `server/src/schema.sql` — DDL đầy đủ:
    ```sql
    CREATE TABLE IF NOT EXISTS yjs_updates (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      doc_id text NOT NULL,
      update_data bytea NOT NULL,
      created_at timestamptz DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS yjs_updates_doc_id_created_at ON yjs_updates (doc_id, created_at);

    CREATE TABLE IF NOT EXISTS yjs_snapshots (
      doc_id text PRIMARY KEY,
      snapshot_data bytea NOT NULL,
      updated_at timestamptz DEFAULT now()
    );

    ALTER TABLE yjs_updates ENABLE ROW LEVEL SECURITY;
    ALTER TABLE yjs_snapshots ENABLE ROW LEVEL SECURITY;
    -- Server dùng service_role key (bypass RLS) — không cần thêm policy
    ```
  - `server/src/index.ts` (modify — wire persistence) — import `{ onLoadDocument, onStoreDocument }` từ `./persistence`; thêm vào `Server.configure({ ..., onLoadDocument, onStoreDocument })`

- **STOP gate:**
  - `cd server && npx tsc --noEmit` → 0 error
  - `server/src/schema.sql` tồn tại
  - `grep -c "yjs_updates\|yjs_snapshots" server/src/schema.sql` → ≥4 hits (2 CREATE TABLE + 2 ENABLE ROW LEVEL SECURITY)
  - `grep -n "onLoadDocument\|onStoreDocument" server/src/index.ts` → ≥2 hits (wired)
  - `grep -n "mergeUpdates\|compaction\|count.*50\|50.*count" server/src/persistence.ts` → ≥2 hits (compaction logic)
  - `grep -n "requireEnv" server/src/persistence.ts` → ≥2 hits (SUPABASE_URL + SUPABASE_SERVICE_KEY)

- **Output artifact:** `server/src/persistence.ts`, `server/src/env.ts`, `server/src/schema.sql`; `server/src/index.ts` (modify wire)

---

### Session C.HG-A [HUMAN GATE] — Supabase project setup

> **Đây là HUMAN GATE — user tự làm trên Supabase dashboard. Claude có thể hỗ trợ qua Chrome extension (browser foreground) khi cần navigation.**

**User thực hiện theo thứ tự:**

1. Vào [https://supabase.com/dashboard](https://supabase.com/dashboard) → tạo project mới HOẶC chọn project đã có (region khuyến nghị: Singapore `ap-southeast-1` để gần VN)
2. Chờ project khởi động xong (≈60 giây)
3. Vào **SQL Editor** (sidebar trái) → New query → paste toàn bộ nội dung `server/src/schema.sql` → **Run**
4. Vào **Table Editor** → verify thấy 2 bảng: `yjs_updates` + `yjs_snapshots`
5. Vào **Project Settings → API:**
   - Copy **Project URL** → đây là `SUPABASE_URL` (vd `https://xxxx.supabase.co`)
   - Copy **service_role** key (secret, không phải anon) → đây là `SUPABASE_SERVICE_KEY`
6. Vào **Project Settings → Auth → JWT Settings** → copy **JWT Secret** → đây là `SUPABASE_JWT_SECRET`
7. Ghi lại 3 giá trị: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_JWT_SECRET`

**Env vars cần cho server (Render, session C.HG-B):**
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...  (service_role, dài ~200 ký tự)
SUPABASE_JWT_SECRET=<jwt-secret>
PORT=3000
```

**STOP gate (user xác nhận trước khi tiếp C.HG-B):**
- `yjs_updates` table visible trong Supabase Table Editor (có cột `id`, `doc_id`, `update_data`, `created_at`)
- `yjs_snapshots` table visible (có cột `doc_id`, `snapshot_data`, `updated_at`)
- 3 giá trị env đã ghi lại đầy đủ

---

### Session C.HG-B [HUMAN GATE] — Render deploy + health verify

> **Đây là HUMAN GATE — user tự làm trên Render dashboard. Claude có thể hỗ trợ qua Chrome extension (browser foreground) khi cần navigation.**

**Điều kiện trước:** C.HG-A pass + `server/` directory đã push lên GitHub main branch.

**User thực hiện theo thứ tự:**

1. Vào [https://render.com/dashboard](https://render.com/dashboard) → **New → Web Service**
2. Connect repository GitHub (chọn repo `Nib`) → Root Directory: `server`
3. **Runtime:** Node; **Build Command:** `npm install && npm run build`; **Start Command:** `node dist/index.js`
4. **Plan:** Free
5. **Environment Variables → Add All:**
   - `SUPABASE_URL` = (từ C.HG-A)
   - `SUPABASE_SERVICE_KEY` = (từ C.HG-A)
   - `SUPABASE_JWT_SECRET` = (từ C.HG-A)
   - `PORT` = `3000`
6. **Create Web Service** → chờ deploy (≈2–5 phút)
7. Sau khi status = **Live**: copy URL dạng `https://nib-hocuspocus-xxxx.onrender.com`
8. Verify health: `curl https://nib-hocuspocus-xxxx.onrender.com/health` → phải trả `200 OK`
9. Ghi lại URL → `VITE_HOCUSPOCUS_URL=wss://nib-hocuspocus-xxxx.onrender.com` (đổi `https` → `wss`)

**STOP gate (user xác nhận trước khi tiếp C.3):**
- `GET https://<render-url>/health` → 200 OK (curl hoặc browser)
- Render dashboard logs: không có `ERROR` / `FATAL` / uncaught exception
- `wss://<render-url>` URL sẵn sàng

---

### Session C.3 [CODE] — Client wire + env + gate vàng

- **Scope (WHAT):**
  - `.env.example` (root repo, modify) — đổi comment dòng `VITE_HOCUSPOCUS_URL`:
    ```
    # Phase B local dev:
    # VITE_HOCUSPOCUS_URL=ws://localhost:1234
    # Phase C production (Render — đổi sang URL thật):
    VITE_HOCUSPOCUS_URL=wss://<your-render-url>
    ```
  - `src/lib/yProvider.ts` — verify `token` được truyền đúng vào `HocuspocusProvider` options field `token`. Nếu thiếu → patch thêm `token: token ?? ""` (Phase B đã có theo PLAN B Session B.1 nhưng cần verify thực tế)
  - `src/providers/YjsProvider/YjsProvider.tsx` — verify prop `token` (từ ProfileProvider `session?.access_token`) đã được truyền xuống `createHocuspocusProvider`; nếu cần → patch wire
  - `server/src/README.md` — tài liệu ngắn: env vars required, local dev (`VITE_HOCUSPOCUS_URL=ws://localhost:1234 npx @hocuspocus/server`), CC-2 note (spin-down ~15ph → sync delay cold-start, client reconnect tự động), cách re-deploy Render khi push code mới

- **STOP gate (code — agent tự verify):**
  - `npm run build` exit 0
  - `tsc --noEmit` → 0 error
  - `grep -n "token" src/lib/yProvider.ts` → ≥1 hit trên `token:` trong HocuspocusProvider options (xác nhận truyền token)
  - `grep -n "access_token\|token" src/providers/YjsProvider/YjsProvider.tsx` → ≥1 hit (token wire)

- **Gate vàng — human smoke (2 browser thật qua Render):**
  1. User tạo file `.env` (hoặc `.env.local`) tại root: `VITE_HOCUSPOCUS_URL=wss://<render-url>`
  2. Supabase project đã active (tạo ít nhất 1 user qua signup hoặc dùng LoginModal)
  3. `npm run dev` → mở 2 browser tab (hoặc 2 máy) cùng URL `:1420`
  4. Login cả 2 tab cùng 1 account Supabase (qua LoginModal)
  5. Mở cùng document (cùng `docId`)
  6. Edit block tab 1 (kéo `xOffset`, gõ `latexContent`, nhấn Tính) → tab 2 thấy đúng trong <5 giây (sau cold-start nếu Render mới ngủ, có thể tới 30s)
  7. Verify Supabase Table Editor: `yjs_updates` có row mới với `doc_id = "${userId}:${docId}"`
  8. Offline tab 1 (DevTools Network → Offline) → edit thêm → back online → merge không mất

- **Output artifact:** `.env.example` (modify); `src/lib/yProvider.ts` (verify/patch if needed); `src/providers/YjsProvider/YjsProvider.tsx` (verify/patch if needed); `server/src/README.md` (new)

**Phase C gate** (sau C.3): gate vàng human-verified (2 browser sync thật qua Render + `yjs_updates` row tồn tại trong Supabase) + `npm run build` exit 0 + `tsc --noEmit` 0 error.

---

## Biến môi trường — tóm tắt đầy đủ

| Var | Dùng ở đâu | Nguồn |
|---|---|---|
| `VITE_HOCUSPOCUS_URL` | Client (`src/lib/yProvider.ts`) | User nhập sau C.HG-B; local dev = `ws://localhost:1234` |
| `SUPABASE_URL` | Server (`server/src/persistence.ts`) | Supabase Project Settings → API → Project URL |
| `SUPABASE_SERVICE_KEY` | Server (`server/src/persistence.ts`) | Supabase Project Settings → API → service_role key |
| `SUPABASE_JWT_SECRET` | Server (`server/src/index.ts` onAuthenticate) | Supabase Project Settings → Auth → JWT Settings → JWT Secret |
| `PORT` | Server (`server/src/index.ts`) | Default 3000; Render inject tự động |

**File client cần đổi để trỏ server thật:**
- `.env` (hoặc `.env.local`, không commit) — set `VITE_HOCUSPOCUS_URL=wss://<render-url>`
- `.env.example` — update comment hướng dẫn (Session C.3)

---

## Outcome cuối

- Hocuspocus Node.js server tự host Render free tier; spin-down ~15 phút idle (CC-2 resolved — reconnect backoff client che; sync merge qua IndexedDB buffer).
- Supabase Postgres: `yjs_updates` + `yjs_snapshots`; compaction mỗi 50 update/doc → footprint < 100 MB trên free 500 MB (CC-3 resolved).
- `onAuthenticate` validate Supabase JWT + room `${userId}:${docId}` → bảo vệ document của từng user (R5 Phase B).
- Gate vàng: 2 browser / 2 máy edit cùng doc → sync đúng qua cloud; IndexedDB offline buffer hoạt động.
- Sẵn sàng Phase D (sync status indicator, offline badge, account settings UI).

---

## Revision log

| Date | Change | Lý do |
| --- | --- | --- |
| 2026-06-22 | Initial | Từ ROADMAP Phase C + brief Task #16 + context Phase B done |
