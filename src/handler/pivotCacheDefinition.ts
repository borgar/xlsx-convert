import type { Document } from '@borgar/simple-xml';
import type { PivotCache, PivotCacheField, PivotCacheSharedItem } from '@jsfkit/types';
import { attr, numAttr } from '../utils/attr.ts';

export function handlerPivotCacheDefinition (dom: Document): PivotCache | void {
  const root = dom.getElementsByTagName('pivotCacheDefinition')[0];
  if (!root) { return; }

  const cacheSource = root.getElementsByTagName('cacheSource')[0];
  if (!cacheSource) { return; }

  const sourceType = attr(cacheSource, 'type');
  if (sourceType !== 'worksheet') { return; }

  const wsSource = cacheSource.getElementsByTagName('worksheetSource')[0];
  if (!wsSource) { return; }

  const ref = attr(wsSource, 'ref');
  const sheet = attr(wsSource, 'sheet');
  if (!ref || !sheet) { return; }

  const fields: PivotCacheField[] = [];
  for (const cf of root.querySelectorAll('cacheFields > cacheField')) {
    const name = attr(cf, 'name');
    const numFmtId = numAttr(cf, 'numFmtId');
    const formula = attr(cf, 'formula');

    const field: PivotCacheField = { name };
    if (numFmtId != null) {
      field.numFmtId = numFmtId;
    }
    if (formula) {
      field.formula = formula;
    }

    const sharedItemsEl = cf.getElementsByTagName('sharedItems')[0];
    if (sharedItemsEl) {
      const sharedItems: PivotCacheSharedItem[] = [];
      for (const child of sharedItemsEl.children) {
        switch (child.tagName) {
          case 's':
            sharedItems.push({ type: 'string', value: attr(child, 'v') });
            break;
          case 'n':
            sharedItems.push({ type: 'number', value: +attr(child, 'v') });
            break;
          case 'b':
            sharedItems.push({ type: 'boolean', value: !!+attr(child, 'v') });
            break;
          case 'd':
            sharedItems.push({ type: 'date', value: attr(child, 'v') });
            break;
          case 'e':
            sharedItems.push({ type: 'error', value: attr(child, 'v') });
            break;
          case 'm':
            sharedItems.push({ type: 'missing' });
            break;
        }
      }
      if (sharedItems.length > 0) {
        field.sharedItems = sharedItems;
      }
    }
    fields.push(field);
  }

  return {
    sourceType: 'worksheet',
    worksheetSource: { ref, sheet },
    fields,
  };
}
