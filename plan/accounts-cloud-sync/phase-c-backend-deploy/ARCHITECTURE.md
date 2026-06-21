# Phase C (Backend Deploy) — ARCHITECTURE (architect HOW, gate PASS 2026-06-22)

> Bản thiết kế HOW do `architect` soạn (Task #17), lead gate PASS + filed. Nguồn cho implementer build C.1 + C.2. W1 (single-port health) + W2 (binary Yjs→Postgres) đã giải dứt. KHÔNG re-litigate stack [LOCKED].

## A. Component / module breakdown

Thư mục `server/` mới tạo tại repo root (ngang `src/`, `src-tauri/`, `backend/`).

```
server/
├── package.json          # deps: @hocuspocus/server ^4, @supabase/supabase-js ^2, jsonwebtoken ^9, yjs ^13
├── tsconfig.json         # target ES2022, module commonjs, outDir ./dist, rootDir ./src, strict+esModuleInterop
├── Dockerfile            # FROM node:20-slim, WORKDIR /app, COPY, npm ci --production, CMD node dist/index.js
└── src/
    ├── index.ts          # Entry: Server.configure + onRequest(health, W1) + onAuthenticate + wire persistence
    ├── persistence.ts    # Supabase client singleton + onLoadDocument + onStoreDocument + compaction
    ├── env.ts            # requireEnv(key): string — fail-fast helper
    └── schema.sql        # DDL 2 bảng yjs_updates + yjs_snapshots (TEXT columns, W2) + index + RLS
```

Phụ thuộc: `index.ts` import `requireEnv` từ `./env` + `{onLoadDocument,onStoreDocument}` từ `./persistence` + `@hocuspocus/server` + `jsonwebtoken`. `persistence.ts` import `requireEnv` + `yjs` + `@supabase/supabase-js`. `env.ts` pure.

Root mod: `.env.example` append block `# Hocuspocus server env`: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_JWT_SECRET`, `PORT=3000`.

## B. API contract

### env.ts
```
requireEnv(key: string): string
  → undefined hoặc '' → throw Error(`Missing required env: ${key}`)
  → trả process.env[key]
```

### index.ts — Server.configure hooks

**W1 GIẢI — onRequest hook serve /health cùng port, KHÔNG http.createServer thứ 2.**
Hocuspocus v4 tạo internal HTTP server; plain HTTP request đi qua hook `onRequest` trước khi 404. WS upgrade đi qua event `'upgrade'` riêng, KHÔNG qua onRequest → không bị chặn.
```
onRequest({ request, response }): Promise<void>
  if request.url === '/health':
    response.writeHead(200, {'Content-Type':'text/plain'}); response.end('OK'); return
  // else: không write → Hocuspocus trả 404
```
Port: `const PORT = parseInt(process.env.PORT ?? '3000', 10)` trong `Server.configure({ port: PORT })`. Render inject `process.env.PORT` — KHÔNG hardcode 3000.

**onAuthenticate (validate JWT + room R5):**
```
async onAuthenticate({ token, documentName }): Promise<void>
  1. jwt.verify(token, requireEnv('SUPABASE_JWT_SECRET')) → payload (throw nếu invalid/expired)
  2. guard: if (!payload.sub || typeof payload.sub !== 'string') throw Error('missing-sub')  [E4]
  3. const parts = documentName.split(':'); if (parts.length !== 2) throw Error('invalid-room-format')
  4. const [claimedUserId] = parts; if (payload.sub !== claimedUserId) throw Error('unauthorized')
  5. return (authorized)
  // throw → Hocuspocus đóng WS với code 403
```

### persistence.ts

**W2 GIẢI — TEXT column (base64) thay bytea** (supabase-js/PostgREST không truyền Uint8Array→bytea).
```
uint8ToBase64(data: Uint8Array): string  → Buffer.from(data).toString('base64')
base64ToUint8(b64: string): Uint8Array    → new Uint8Array(Buffer.from(b64, 'base64'))

const supabase = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_KEY'))
// service_role bypass RLS — chỉ server-side, KHÔNG expose client
```

**onLoadDocument({ documentName }): Promise<Uint8Array>** — `docId = documentName` (full `${userId}:${docId}` làm composite key):
1. SELECT snapshot_data, updated_at FROM yjs_snapshots WHERE doc_id=docId .single() → snapshot|null
2. afterTime = snapshot?.updated_at ?? '1970-01-01T00:00:00Z'; SELECT update_data FROM yjs_updates WHERE doc_id=docId AND created_at > afterTime ORDER BY created_at ASC
3. if !snapshot && updates.length===0: return new Uint8Array(0); else parts=[(snapshot?base64ToUint8(snapshot.snapshot_data):none), ...updates.map(base64ToUint8)]; return Y.mergeUpdates(parts)

**onStoreDocument({ documentName, document }): Promise<void>**:
1. update = Y.encodeStateAsUpdate(document); INSERT yjs_updates {doc_id, update_data: uint8ToBase64(update)}
2. count = SELECT count(*) head exact WHERE doc_id=docId
3. COMPACTION nếu count>50 (async fire-and-forget, try/catch log KHÔNG throw): SELECT all update_data → Y.mergeUpdates → UPSERT yjs_snapshots {doc_id, snapshot_data: base64, updated_at: now} → DELETE yjs_updates WHERE doc_id=docId. Guard per-docId in-memory lock (Map<string,boolean>) tránh race [E2].

## C. Data flow

```
[Client] WS connect (token=JWT, room="${userId}:${docId}")
  → onAuthenticate: jwt.verify → payload.sub; split(':')[0]===sub? OK : throw 403
  → onLoadDocument: SELECT snapshot + updates(after) → Y.mergeUpdates → apply Y.Doc → gửi client
  → [Client edit block] patchBlockMeta → Y.XmlFragment + Y.Map "blockMeta" → HocuspocusProvider WS → server merge
  → onStoreDocument: Y.encodeStateAsUpdate → INSERT yjs_updates(base64); count>50 → async compaction
[HTTP GET /health] onRequest cùng port → 200 OK
[Client offline] y-indexeddb buffer → reconnect backoff (Phase B) → merge CRDT khi WS lại
```
State: Client = Y.Doc in-mem + IndexedDB; Server = Hocuspocus Y.Doc per room in-mem + persist Postgres; Postgres = yjs_updates (append-only) + yjs_snapshots (latest per docId).

## D. File structure + schema

`.env.example` append:
```
# Hocuspocus server env (server/ only, KHÔNG expose client)
SUPABASE_URL=
SUPABASE_SERVICE_KEY=   # service_role — KHÔNG commit, KHÔNG expose client
SUPABASE_JWT_SECRET=
PORT=3000
```

package.json: name nib-hocuspocus-server; deps @hocuspocus/server ^4, @supabase/supabase-js ^2, jsonwebtoken ^9, yjs ^13; devDeps typescript ^5, ts-node ^10, @types/node ^22, @types/jsonwebtoken ^9; scripts build="tsc", start="node dist/index.js", dev="ts-node src/index.ts".
tsconfig.json: target ES2022, module commonjs, outDir ./dist, rootDir ./src, strict, esModuleInterop, resolveJsonModule.
Dockerfile: FROM node:20-slim; COPY package*.json; npm ci --production; COPY dist ./dist; EXPOSE 3000; CMD node dist/index.js.

**schema.sql (W2 — bytea→text):**
```sql
CREATE TABLE IF NOT EXISTS yjs_updates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id      text NOT NULL,
  update_data text NOT NULL,         -- base64-encoded Uint8Array
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS yjs_updates_doc_id_created_at ON yjs_updates (doc_id, created_at);

CREATE TABLE IF NOT EXISTS yjs_snapshots (
  doc_id        text PRIMARY KEY,
  snapshot_data text NOT NULL,       -- base64-encoded merged Uint8Array
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE yjs_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE yjs_snapshots ENABLE ROW LEVEL SECURITY;
-- Server dùng service_role key (bypass RLS) — không cần policy thêm; client KHÔNG truy cập trực tiếp
```

## E. Rủi ro kỹ thuật

- **E1 — onRequest có thể không fire/version drift → /health 404 → Render unhealthy.** Phòng: implementer PHẢI test local trước push: `cd server && ts-node src/index.ts` → `curl localhost:3000/health` = 200. Fallback nếu hook không fire: `const hocus = Server.configure({...}); hocus.httpServer.on('request',(req,res)=>{ if(req.url==='/health'){res.writeHead(200);res.end('OK')} })`.
- **E2 — Compaction race (đọc→đếm→delete không atomic).** 2 store đồng thời ở count=49 → double compaction → mất update. Phòng: in-memory lock per-docId (Map<string,boolean>), skip nếu đang chạy (lần sau trigger lại). Single-instance Render free → không cần distributed lock. TODO comment.
- **E3 — Render free WS idle timeout (~30s) proxy drop silently.** Phòng: keep-alive ping 20s (onConfigureServer setInterval gửi ping cho connections) hoặc ws ping-pong option. Ghi README.
- **E4 — payload.sub có thể undefined dù verify pass.** Phòng: guard `if(!payload.sub||typeof payload.sub!=='string') throw`. Log sub (che 4 ký tự cuối) debug. SUPABASE_JWT_SECRET là HS256 symmetric từ Settings→Auth→JWT Settings (KHÔNG phải API key).

## Revision log
| Date | Change | Lý do |
| --- | --- | --- |
| 2026-06-22 | Initial | architect Task #17, lead gate PASS + filed (architect không có Write) |
