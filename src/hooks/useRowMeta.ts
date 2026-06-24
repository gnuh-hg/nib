// React binding for a row's Yjs layout meta (Phase B.2 free-caret rebuild).
//
// Subscribes to the `rowMeta` map and re-renders the consuming RowView whenever
// the row's layout entry changes (locally or from a remote device). Uses
// `observeDeep` so both entry creation and individual field changes are caught.
// Renders DEFAULT_ROW_META until the entry exists (R3 race tolerance).
//
// Mirrors the useBlockMeta pattern (copy khuôn proven in accounts-cloud-sync Phase B).

import { useEffect, useState } from 'react';
import type * as Y from 'yjs';
import { getRowMetaMap } from '@/lib/yjs';
import { getRowMeta, DEFAULT_ROW_META } from '@/lib/yRowMeta';
import type { RowMetaRecord } from '@/lib/yRowMeta';

/**
 * Live layout meta for a single row; re-renders on local or remote changes.
 * When `ydoc` is null (provider not yet bound) returns DEFAULT_ROW_META.
 */
export function useRowMeta(ydoc: Y.Doc | null, rowId: string): RowMetaRecord {
  const [meta, setMeta] = useState<RowMetaRecord>(() => getRowMeta(ydoc, rowId));

  useEffect(() => {
    if (!ydoc) {
      setMeta({ ...DEFAULT_ROW_META });
      return;
    }
    const root = getRowMetaMap(ydoc);
    const update = () => setMeta(getRowMeta(ydoc, rowId));
    update(); // resync immediately on mount / ydoc / rowId change
    root.observeDeep(update);
    return () => root.unobserveDeep(update);
  }, [ydoc, rowId]);

  return meta;
}
