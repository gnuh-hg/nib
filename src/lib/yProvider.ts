// Hocuspocus WebSocket provider factory for Nib.
//
// Connects a Y.Doc to a Hocuspocus server so edits sync across devices. The URL
// comes from VITE_HOCUSPOCUS_URL (ws://localhost:1234 for a local dev server,
// wss://<host-url> in production). The backend (Hocuspocus + Supabase
// yjs_updates + JWT onAuthenticate) validates the room server-side.
//
// Cloud sync is OPT-IN via VITE_HOCUSPOCUS_URL: when it is unset/empty, the app
// runs local-only (IndexedDB persistence, no WS). To enable cross-device sync
// later, deploy the server (see server/) and set VITE_HOCUSPOCUS_URL — no code
// change needed.

import type * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';

/**
 * The configured Hocuspocus URL, or null when cloud sync is disabled.
 * Local-only mode = VITE_HOCUSPOCUS_URL unset or blank.
 */
export function getHocuspocusUrl(): string | null {
  const url = import.meta.env.VITE_HOCUSPOCUS_URL?.trim();
  return url ? url : null;
}

/**
 * Create a Hocuspocus provider binding `ydoc` to the room `${userId}:${docId}`.
 *
 * The caller owns the returned provider and MUST call `.destroy()` when done.
 *
 * We pass `url` (not a custom `websocketProvider`) so the provider MANAGES its
 * own websocket (`manageSocket=true`). This is REQUIRED for the connection to
 * open: the provider only calls `attach()` — which opens + syncs the socket —
 * when it manages the socket. Passing a custom `websocketProvider` leaves
 * `manageSocket=false`, so `attach()` is never called and the provider silently
 * never connects (confirmed in @hocuspocus/provider 4.3 dist lines 715 /
 * 718–720). With `manageSocket=true`, `provider.destroy()` also tears the socket
 * down (line 880), so the caller's single `.destroy()` is a complete cleanup.
 *
 * Reconnect backoff is left at the library defaults, which already match our
 * intent (1s base, ×2, capped at 30s — dist defaults delay:1000 / factor:2 /
 * maxDelay:30000). The URL-variant config type does not expose these knobs, and
 * overriding them would force the custom-websocket path that breaks `attach()`.
 */
export function createHocuspocusProvider(
  ydoc: Y.Doc,
  docId: string,
  userId: string,
  token: string,
): HocuspocusProvider {
  // Callers gate on getHocuspocusUrl(); this is non-null here.
  const url = getHocuspocusUrl() ?? 'ws://localhost:1234';

  // Room name = `${userId}:${docId}:v2`.
  // The `:v2` suffix versions the WS room for the free-caret schema (ARCHITECTURE.md §3
  // rủi ro #1: client v2 MUST NOT merge updates from a v1 server room that still
  // contains nibBlock XML nodes — wrong schema ⇒ corrupt merge). Phase F sync
  // testing will verify the server supports v2 room names.
  const room = `${userId}:${docId}:v2`;

  return new HocuspocusProvider({
    url,
    name: room,
    document: ydoc,
    token,
  });
}
