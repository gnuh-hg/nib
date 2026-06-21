// React binding for a block's Yjs meta entry (Phase B, Session B.2).
//
// Subscribes to the `blockMeta` map and re-renders the consuming block whenever
// its entry changes (locally or from a remote device). Uses `observeDeep` so
// both entry creation and individual field changes are caught. Renders
// DEFAULT_META until the entry exists (R3 race tolerance).

import { useEffect, useState } from 'react';
import type * as Y from 'yjs';
import { getBlockMetaMap } from '@/lib/yjs';
import { getBlockMeta } from '@/editor/yBlockMeta';
import type { BlockMetaRecord } from '@/types/block';

/**
 * Live meta for a single block; re-renders on local or remote changes.
 * When `ydoc` is null (B.3→B.5 intermediate, before Workspace wires the doc)
 * it returns DEFAULT_META and does not observe.
 */
export function useBlockMeta(ydoc: Y.Doc | null, id: string): BlockMetaRecord {
  const [meta, setMeta] = useState<BlockMetaRecord>(() => getBlockMeta(ydoc, id));

  useEffect(() => {
    if (!ydoc) {
      setMeta(getBlockMeta(null, id)); // DEFAULT_META
      return;
    }
    const root = getBlockMetaMap(ydoc);
    const update = () => setMeta(getBlockMeta(ydoc, id));
    update(); // resync immediately on mount / ydoc / id change
    root.observeDeep(update);
    return () => root.unobserveDeep(update);
  }, [ydoc, id]);

  return meta;
}
