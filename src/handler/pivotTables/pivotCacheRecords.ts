import type { Document } from '@borgar/simple-xml';
import type { PivotCacheRecord, PivotCacheRecordValue } from '@jsfkit/types';
import { attr } from '../../utils/attr.ts';
import { parseCacheSharedItem } from './parseCacheSharedItem.ts';

export function handlerPivotCacheRecords (dom: Document): PivotCacheRecord[] {
  const root = dom.querySelector('pivotCacheRecords');
  if (!root) { return []; }

  const records: PivotCacheRecord[] = [];
  for (const r of root.getElementsByTagName('r')) {
    const record: PivotCacheRecordValue[] = [];
    for (const child of r.children) {
      if (child.tagName === 'x') {
        record.push({ t: 'x', v: +attr(child, 'v', '0') });
      }
      else {
        const item = parseCacheSharedItem(child);
        if (item) { record.push(item); }
      }
    }
    records.push(record);
  }

  return records;
}
