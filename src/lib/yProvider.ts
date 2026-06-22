// Hocuspocus WebSocket provider factory for Nib.
//
// Connects a Y.Doc to a Hocuspocus server so edits sync across devices. The URL
// comes from VITE_HOCUSPOCUS_URL (ws://localhost:1234 for a local dev server,
// wss://<render-url> in production). The backend (Render + Supabase
// yjs_updates + JWT onAuthenticate) validates the room server-side.

import type * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';

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
  const url = import.meta.env.VITE_HOCUSPOCUS_URL ?? 'ws://localhost:1234';

  // Room name = `${userId}:${docId}`. The server validates this room in
  // onAuthenticate — comparing `userId` against the Supabase JWT `sub` claim so a
  // user cannot open another user's room (see ARCHITECTURE.md §E R5).
  const room = `${userId}:${docId}`;

  return new HocuspocusProvider({
    url,
    name: room,
    document: ydoc,
    token,
  });
}
