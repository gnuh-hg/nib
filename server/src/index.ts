/**
 * index.ts — Nib Hocuspocus server entry point.
 *
 * - Single-port HTTP `/health` endpoint via the `onRequest` hook (W1 — no second
 *   http.createServer). WS upgrades flow through the internal 'upgrade' event and
 *   are NOT affected by onRequest.
 * - `onAuthenticate` validates the Supabase JWT (HS256, SUPABASE_JWT_SECRET) and
 *   enforces the room contract `${userId}:${docId}` (R5): parts[0] must equal
 *   payload.sub.
 * - Persistence (onLoadDocument / onStoreDocument) is wired from ./persistence
 *   (Session C.2) — Supabase Postgres with CC-3 compaction.
 */

import type { IncomingMessage, ServerResponse } from "http";
import { Server, onRequestPayload, onAuthenticatePayload } from "@hocuspocus/server";
import jwt from "jsonwebtoken";
import { requireEnv } from "./env";
import { onLoadDocument, onStoreDocument } from "./persistence";

// Render injects PORT; default 3000 for local dev. KHÔNG hardcode.
const PORT = parseInt(process.env.PORT ?? "3000", 10);

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

  /**
   * Validate the Supabase JWT and enforce the room contract.
   * Throwing closes the WS connection with a 403.
   */
  async onAuthenticate({ token, documentName }: onAuthenticatePayload): Promise<void> {
    // 1. Verify JWT signature + expiry (throws on invalid/expired).
    const payload = jwt.verify(token, requireEnv("SUPABASE_JWT_SECRET"));

    // 2. Guard: payload.sub must be a non-empty string (E4 — sub may be absent
    //    even when verify passes).
    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      payload.sub === ""
    ) {
      throw new Error("missing-sub");
    }

    // 3. Room format must be `${userId}:${docId}` — exactly 2 parts.
    const parts = documentName.split(":");
    if (parts.length !== 2) {
      throw new Error("invalid-room-format");
    }

    // 4. R5 — first part must match the authenticated user.
    const claimedUserId = parts[0];
    if (payload.sub !== claimedUserId) {
      throw new Error("unauthorized");
    }

    // 5. Authorized.
  },

  // Persistence (Session C.2) — Supabase Postgres + CC-3 compaction.
  onLoadDocument,
  onStoreDocument,
});

server.listen();

// eslint-disable-next-line no-console
console.log(`[nib-hocuspocus] listening on port ${PORT}`);
