# Nib Hocuspocus Server

Self-hosted [Hocuspocus](https://tiptap.dev/docs/hocuspocus) (Yjs) WebSocket
server powering Nib cloud sync. Validates Supabase JWTs and persists Yjs updates
to Supabase Postgres.

## What it does

- **WebSocket sync** — relays Yjs document updates between devices (room =
  `${userId}:${docId}`).
- **Auth** (`onAuthenticate`) — verifies the Supabase access token against the
  project's **JWKS** endpoint (asymmetric **ECC ES256** signing keys), then
  enforces the room contract: the room's `userId` must equal the token's `sub`
  claim (R5). No HS256 shared secret is used.
- **Persistence** (`onLoadDocument` / `onStoreDocument`) — loads/stores Yjs
  state in Supabase (`yjs_updates` + `yjs_snapshots`), with CC-3 compaction.
- **Health** — `GET /health` → `200 OK` on the same port as the WS server.

## Required env vars

Set these in Render → **Environment** (never commit them):

| Var | Required | Notes |
|---|---|---|
| `SUPABASE_URL` | ✅ | Project URL, e.g. `https://xxxx.supabase.co`. Used for the JWKS endpoint (`/auth/v1/.well-known/jwks.json`, public) **and** the Postgres client. |
| `SUPABASE_SERVICE_KEY` | ✅ | `service_role` key — bypasses RLS for server-side persistence. **Secret.** |
| `PORT` | ⬜ | Render injects this automatically; defaults to `3000` locally. |

> `SUPABASE_JWT_SECRET` is **no longer needed** — the project signs tokens with
> asymmetric JWT signing keys (ECC), so verification goes through JWKS, not a
> shared secret.

## Local dev

```bash
cd server
npm install
# JWKS is fetched lazily on the first auth, so boot works without a live project.
SUPABASE_URL=https://example.supabase.co SUPABASE_SERVICE_KEY=x npm run dev
curl -s -o /dev/null -w '%{http_code}\n' localhost:3000/health   # → 200
```

For real auth/persistence, use your actual `SUPABASE_URL` + `SUPABASE_SERVICE_KEY`.

## Client wiring

The web client connects via `VITE_HOCUSPOCUS_URL`:

- Local: `ws://localhost:1234`
- Production: `wss://<your-render-url>` (TLS)

Set it in the client's `.env.local` (gitignored), then restart `npm run dev`.

## Deploy / re-deploy (Render)

The repo is **public**, so Render does **not** auto-deploy on push. To ship
changes: Render Dashboard → the service → **Manual Deploy** → *Deploy latest
commit* (or *Clear build cache & deploy* if dependencies changed).

## CC-2 — free-tier cold start

On Render's free tier the service **spins down after ~15 min idle**. The first
connection after idle incurs a cold-start delay (a few seconds) while the
instance wakes. The client handles this transparently: Hocuspocus reconnect
backoff (1s base, ×2, capped 30s) retries until the server is up, and
offline-first IndexedDB persistence means local edits are never lost while
waiting. No user action required.
