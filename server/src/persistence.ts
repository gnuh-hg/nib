/**
 * persistence.ts — Supabase Postgres persistence for the Hocuspocus server.
 *
 * W2 GIẢI: Yjs binary (Uint8Array) is stored as base64 in TEXT columns, because
 * supabase-js / PostgREST cannot round-trip Uint8Array → bytea. See schema.sql.
 *
 * CC-3: yjs_updates is append-only; every store appends one row. When a doc's
 * update count exceeds COMPACTION_THRESHOLD, updates are merged into a single
 * row in yjs_snapshots and the old update rows are deleted, keeping the Postgres
 * footprint small on the Supabase free tier.
 *
 * The Supabase client uses the service_role key → bypasses RLS. This module is
 * SERVER-SIDE ONLY and must never be exposed to the client.
 */

import * as Y from "yjs";
import { createClient } from "@supabase/supabase-js";
import type {
  onLoadDocumentPayload,
  onStoreDocumentPayload,
} from "@hocuspocus/server";
import { requireEnv } from "./env";

// --- Supabase client singleton (service_role — bypasses RLS) ----------------
const supabase = createClient(
  requireEnv("SUPABASE_URL"),
  requireEnv("SUPABASE_SERVICE_KEY")
);

// --- Binary <-> base64 helpers (W2) -----------------------------------------
export function uint8ToBase64(data: Uint8Array): string {
  return Buffer.from(data).toString("base64");
}

export function base64ToUint8(b64: string): Uint8Array {
  return new Uint8Array(Buffer.from(b64, "base64"));
}

// --- Compaction config + per-docId race lock (E2) ---------------------------
const COMPACTION_THRESHOLD = 50;

/**
 * In-memory lock per docId so two concurrent stores can't both run compaction
 * (read → count → delete is not atomic). Single-instance Render free tier →
 * an in-memory Map suffices; no distributed lock needed.
 * TODO: if scaling to multiple instances, replace with an advisory lock in
 * Postgres (pg_advisory_lock) keyed by docId.
 */
const compacting = new Map<string, boolean>();

/**
 * Load a document's state: latest snapshot + all updates appended after it,
 * merged into a single Yjs update. Returns an empty Uint8Array when nothing is
 * stored (Hocuspocus then starts a fresh doc).
 */
export async function onLoadDocument({
  documentName,
}: onLoadDocumentPayload): Promise<Uint8Array> {
  const docId = documentName;

  // 1. Latest snapshot (may be absent).
  const { data: snapshot } = await supabase
    .from("yjs_snapshots")
    .select("snapshot_data, updated_at")
    .eq("doc_id", docId)
    .single();

  // 2. Updates appended after the snapshot (or from epoch if no snapshot).
  const afterTime: string = snapshot?.updated_at ?? "1970-01-01T00:00:00Z";
  const { data: updates } = await supabase
    .from("yjs_updates")
    .select("update_data")
    .eq("doc_id", docId)
    .gt("created_at", afterTime)
    .order("created_at", { ascending: true });

  const updateRows = updates ?? [];

  // eslint-disable-next-line no-console
  console.log(
    `[load] doc=${docId} snapshot=${snapshot ? "yes" : "no"} updates=${updateRows.length}`,
  );

  // 3. Nothing stored → fresh doc.
  if (!snapshot && updateRows.length === 0) {
    return new Uint8Array(0);
  }

  const parts: Uint8Array[] = [];
  if (snapshot) {
    parts.push(base64ToUint8(snapshot.snapshot_data));
  }
  for (const row of updateRows) {
    parts.push(base64ToUint8(row.update_data));
  }

  return Y.mergeUpdates(parts);
}

/**
 * Store a document: append its full state as one update row, then trigger
 * compaction (fire-and-forget) when the update count exceeds the threshold.
 */
export async function onStoreDocument({
  documentName,
  document,
}: onStoreDocumentPayload): Promise<void> {
  const docId = documentName;

  const update = Y.encodeStateAsUpdate(document);
  // eslint-disable-next-line no-console
  console.log(`[store] doc=${docId} bytes=${update.length}`);
  await supabase
    .from("yjs_updates")
    .insert({ doc_id: docId, update_data: uint8ToBase64(update) });

  const { count } = await supabase
    .from("yjs_updates")
    .select("*", { count: "exact", head: true })
    .eq("doc_id", docId);

  if ((count ?? 0) > COMPACTION_THRESHOLD) {
    // eslint-disable-next-line no-console
    console.log(`[compact] doc=${docId} count=${count}`);
    // Fire-and-forget: compaction must never block or fail the store path.
    void compactDocument(docId);
  }
}

/**
 * Merge all updates for a docId into a single snapshot row and delete the
 * merged update rows. Guarded by an in-memory per-docId lock (E2) so concurrent
 * stores don't double-compact. Errors are logged, never thrown.
 */
async function compactDocument(docId: string): Promise<void> {
  if (compacting.get(docId)) {
    return; // already compacting — a later store will trigger again if needed
  }
  compacting.set(docId, true);
  try {
    const { data: updates } = await supabase
      .from("yjs_updates")
      .select("update_data")
      .eq("doc_id", docId)
      .order("created_at", { ascending: true });

    const updateRows = updates ?? [];
    if (updateRows.length === 0) {
      return;
    }

    const merged = Y.mergeUpdates(updateRows.map((r) => base64ToUint8(r.update_data)));

    await supabase.from("yjs_snapshots").upsert({
      doc_id: docId,
      snapshot_data: uint8ToBase64(merged),
      updated_at: new Date().toISOString(),
    });

    await supabase.from("yjs_updates").delete().eq("doc_id", docId);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      `[compact] FAIL doc=${docId}:`,
      err instanceof Error ? err.message : err,
    );
  } finally {
    compacting.delete(docId);
  }
}
