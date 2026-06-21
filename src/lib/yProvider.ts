// Hocuspocus WebSocket provider factory for Nib (Phase B, Session B.1).
//
// Connects a Y.Doc to a Hocuspocus server so edits sync across devices. In
// Phase B this targets a LOCAL @hocuspocus/server (ws://localhost:1234, see
// VITE_HOCUSPOCUS_URL). The real multi-device backend (Render + Supabase
// yjs_updates + JWT onAuthenticate) is Phase C.

import type * as Y from 'yjs';
import { HocuspocusProvider, HocuspocusProviderWebsocket } from '@hocuspocus/provider';

/** Reconnect backoff: 1s base, doubling, capped at 30s (ARCHITECTURE §A). */
const RECONNECT_DELAY = 1000;
const RECONNECT_FACTOR = 2;
const RECONNECT_MAX_DELAY = 30000;

/**
 * Create a Hocuspocus provider binding `ydoc` to the room `${userId}:${docId}`.
 *
 * The caller owns the returned provider and MUST call `.destroy()` when done.
 * We attach a dedicated websocket (to control the reconnect backoff) and tear
 * it down on the provider's "destroy" event, so `provider.destroy()` alone is a
 * complete cleanup — no leaked socket.
 */
export function createHocuspocusProvider(
  ydoc: Y.Doc,
  docId: string,
  userId: string,
  token: string,
): HocuspocusProvider {
  const url = import.meta.env.VITE_HOCUSPOCUS_URL ?? 'ws://localhost:1234';

  // Room name = `${userId}:${docId}`.
  // Phase C: validate this room in onAuthenticate — compare `userId` against the
  // Supabase JWT claim server-side so a user cannot open another user's room
  // (see ARCHITECTURE.md §E R5). Phase B's local server trusts all rooms.
  const room = `${userId}:${docId}`;

  const websocketProvider = new HocuspocusProviderWebsocket({
    url,
    delay: RECONNECT_DELAY,
    factor: RECONNECT_FACTOR,
    maxDelay: RECONNECT_MAX_DELAY,
  });

  const provider = new HocuspocusProvider({
    websocketProvider,
    name: room,
    document: ydoc,
    token,
  });

  // We created this websocket, so we tear it down with the provider. (When no
  // websocketProvider is passed Hocuspocus manages its own; here we manage ours.)
  provider.on('destroy', () => {
    websocketProvider.destroy();
  });

  return provider;
}
