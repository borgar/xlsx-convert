import type { Document } from '@borgar/simple-xml';
import type { PivotCacheRecord, PivotCacheRecordValue } from '@jsfkit/types';
import { attr } from '../utils/attr.ts';

export function handlerPivotCacheRecords (dom: Document): PivotCacheRecord[] {
  const root = dom.getElementsByTagName('pivotCacheRecords')[0];
  if (!root) { return []; }

  const records: PivotCacheRecord[] = [];
  for (const r of root.getElementsByTagName('r')) {
    const record: PivotCacheRecordValue[] = [];
    for (const child of r.children) {
      switch (child.tagName) {
        case 'x':
          record.push({ x: +attr(child, 'v', '0') });
          break;
        case 'n':
          record.push(+attr(child, 'v'));
          break;
        case 's':
          record.push(attr(child, 'v'));
          break;
        case 'b':
          record.push(!!+attr(child, 'v'));
          break;
        case 'd':
          record.push({ d: attr(child, 'v') });
          break;
        case 'e':
          record.push({ e: attr(child, 'v') });
          break;
        case 'm':
          record.push(null);
          break;
      }
    }
    records.push(record);
  }

  return records;
}
