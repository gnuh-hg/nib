/**
 * index.ts — Nib Hocuspocus server entry point.
 *
 * - Single-port HTTP `/health` endpoint via the `onRequest` hook (W1 — no second
 *   http.createServer). WS upgrades flow through the internal 'upgrade' event and
 *   are NOT affected by onRequest.
 * - `onAuthenticate` validates the Supabase JWT (asymmetric ECC ES256, verified
 *   against the project's JWKS endpoint via `jose`) and enforces the room
 *   contract `${userId}:${docId}` (R5): parts[0] must equal payload.sub.
 * - Persistence (onLoadDocument / onStoreDocument) is wired from ./persistence
 *   (Session C.2) — Supabase Postgres with CC-3 compaction.
 */

import type { IncomingMessage, ServerResponse } from "http";
import {
  Server,
  onRequestPayload,
  onAuthenticatePayload,
  onConnectPayload,
} from "@hocuspocus/server";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { requireEnv } from "./env";
import { onLoadDocument, onStoreDocument } from "./persistence";

// Render injects PORT; default 3000 for local dev. KHÔNG hardcode.
const PORT = parseInt(process.env.PORT ?? "3000", 10);

/**
 * JWKS singleton — Supabase signs access tokens with an asymmetric ECC (ES256)
 * key. We verify against the project's public JWKS endpoint instead of an HS256
 * shared secret. `createRemoteJWKSet` is lazy: it does NOT fetch at construction
 * time, only on the first `jwtVerify` call, then caches + auto-rotates keys.
 * The endpoint is public (no apikey header required).
 */
const JWKS = createRemoteJWKSet(
  new URL(`${requireEnv("SUPABASE_URL")}/auth/v1/.well-known/jwks.json`),
);

/** Handle a plain HTTP request — serves GET /health → 200 'OK'. Returns true if handled. */
function handleHealth(request: IncomingMessage, response: ServerResponse): boolean {
  if (request.url === "/health") {
    response.writeHead(200, { "Content-Type": "text/plain" });
    response.end("OK");
    return true;
  }
  return false;
}

const server = new Server({
  port: PORT,

  /**
   * W1 — serve /health on the SAME port as the WS server. Hocuspocus routes
   * plain HTTP requests through onRequest before its default response. Writing
   * + ending the response then rejecting interrupts the hook chain so Hocuspocus
   * does not also try to respond (documented pattern).
   */
  async onRequest({ request, response }: onRequestPayload): Promise<void> {
    if (handleHealth(request, response)) {
      // Interrupt the hook chain — response already sent.
      return Promise.reject();
    }
  },

  /** Diagnostic: a WS client established a connection to a room. */
  async onConnect({ documentName }: onConnectPayload): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(`[conn] connect room=${documentName}`);
  },

  /**
   * Validate the Supabase JWT and enforce the room contract.
   * Throwing closes the WS connection with a 403.
   */
  async onAuthenticate({ token, documentName }: onAuthenticatePayload): Promise<void> {
    // 1. Verify JWT signature + expiry against Supabase's JWKS (asymmetric ES256).
    //    jwtVerify throws on invalid signature / expiry / unreachable JWKS.
    let payload;
    try {
      ({ payload } = await jwtVerify(token, JWKS));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(
        `[auth] FAIL room=${documentName}:`,
        err instanceof Error ? err.message : err,
      );
      throw new Error("unauthorized");
    }

    // 2. Guard: payload.sub must be a non-empty string (E4 — sub may be absent
    //    even when verify passes).
    if (typeof payload.sub !== "string" || payload.sub === "") {
      // eslint-disable-next-line no-console
      console.error(`[auth] FAIL room=${documentName}: missing-sub`);
      throw new Error("missing-sub");
    }

    // 3. Room format must be `${userId}:${docId}` — exactly 2 parts.
    const parts = documentName.split(":");
    if (parts.length !== 2) {
      // eslint-disable-next-line no-console
      console.error(`[auth] FAIL room=${documentName}: invalid-room-format`);
      throw new Error("invalid-room-format");
    }

    // 4. R5 — first part must match the authenticated user.
    const claimedUserId = parts[0];
    if (payload.sub !== claimedUserId) {
      // eslint-disable-next-line no-console
      console.error(
        `[auth] FAIL room=${documentName}: room-user-mismatch (sub=${payload.sub})`,
      );
      throw new Error("unauthorized");
    }

    // 5. Authorized.
    // eslint-disable-next-line no-console
    console.log(`[auth] OK user=${payload.sub} room=${documentName}`);
  },

  // Persistence (Session C.2) — Supabase Postgres + CC-3 compaction.
  onLoadDocument,
  onStoreDocument,
});

server.listen();

// eslint-disable-next-line no-console
console.log(`[nib-hocuspocus] listening on port ${PORT}`);
