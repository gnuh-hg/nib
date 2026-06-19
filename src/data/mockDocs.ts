import type { DocEntry } from '@/types/doc';

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** Static document list for the rail until a real store lands (S1.5+ / backend). */
export const MOCK_DOCS: DocEntry[] = [
  {
    id: 'doc-calc-3',
    title: 'Calculus — Session 3',
    updatedAt: new Date(Date.now() - 2 * HOUR).toISOString(),
    createdAt: new Date(Date.now() - 3 * DAY).toISOString(),
  },
  {
    id: 'doc-series-4',
    title: 'Session 4 — Series',
    updatedAt: new Date(Date.now() - 5 * MIN).toISOString(),
    createdAt: new Date(Date.now() - 2 * DAY).toISOString(),
  },
  {
    id: 'doc-limits-1',
    title: 'Session 1 — Limits',
    updatedAt: new Date(Date.now() - 3 * DAY).toISOString(),
    createdAt: new Date(Date.now() - 8 * DAY).toISOString(),
  },
  {
    id: 'doc-linalg',
    title: 'Linear Algebra',
    updatedAt: new Date(Date.now() - 7 * DAY).toISOString(),
    createdAt: new Date(Date.now() - 30 * DAY).toISOString(),
  },
];
