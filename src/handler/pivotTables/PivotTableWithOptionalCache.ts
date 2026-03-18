import type { PivotTable } from '@jsfkit/types';

/** Pivot table parsed from XML, before the cache has been resolved by the caller. */
export type PivotTableWithOptionalCache = Omit<PivotTable, 'cache'> & { cache?: PivotTable['cache'] };
