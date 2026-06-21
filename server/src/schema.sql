-- Nib cloud sync — Supabase Postgres schema (Phase C)
-- Run this in the Supabase SQL Editor (Session C.HG-A).
--
-- W2: Yjs binary is stored base64-encoded in TEXT columns (not bytea), because
-- supabase-js / PostgREST cannot round-trip Uint8Array -> bytea reliably.

-- Append-only log of Yjs document updates.
CREATE TABLE IF NOT EXISTS yjs_updates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id      text NOT NULL,
  update_data text NOT NULL,         -- base64-encoded Uint8Array
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS yjs_updates_doc_id_created_at ON yjs_updates (doc_id, created_at);

-- Latest merged snapshot per document (CC-3 compaction target).
CREATE TABLE IF NOT EXISTS yjs_snapshots (
  doc_id        text PRIMARY KEY,
  snapshot_data text NOT NULL,       -- base64-encoded merged Uint8Array
  updated_at    timestamptz DEFAULT now()
);

-- RLS on both tables. The server uses the service_role key, which bypasses RLS,
-- so no policies are needed; clients never access these tables directly.
ALTER TABLE yjs_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE yjs_snapshots ENABLE ROW LEVEL SECURITY;
