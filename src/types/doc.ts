/** A document entry shown in the sidebar rail / library (design-ref dòng 101–119). */
export interface DocEntry {
  id: string;
  title: string;
  /** ISO timestamp — last modified. */
  updatedAt: string;
  /** ISO timestamp — created. */
  createdAt: string;
}

/** Library view modes (design-ref grid/list toggle). */
export type ViewMode = 'grid' | 'list';

/** Library sort keys (design-ref sort dropdown — modified / name / created). */
export type SortKey = 'modified' | 'name' | 'created';

/** Pure sort used by the library (newest-first for dates, A–Z for name). */
export function sortDocs(docs: DocEntry[], key: SortKey): DocEntry[] {
  const next = [...docs];
  if (key === 'name') {
    next.sort((a, b) => a.title.localeCompare(b.title));
  } else if (key === 'created') {
    next.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  } else {
    next.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  }
  return next;
}
