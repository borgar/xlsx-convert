import type { Document, Element } from '@borgar/simple-xml';
import type { PivotCache, PivotCacheConsolidationRangeSet, PivotCacheField, PivotCacheSharedItem, PivotCacheWorksheetSource } from '@jsfkit/types';
import { attr, boolAttr, numAttr } from '../utils/attr.ts';

export function handlerPivotCacheDefinition (dom: Document): PivotCache | undefined {
  const root = dom.getElementsByTagName('pivotCacheDefinition')[0];
  if (!root) { return; }

  const cacheSource = root.getElementsByTagName('cacheSource')[0];
  if (!cacheSource) { return; }

  const sourceType = attr(cacheSource, 'type');
  const fields = parseFields(root);

  if (sourceType === 'worksheet') {
    const wsSource = cacheSource.getElementsByTagName('worksheetSource')[0];
    if (!wsSource) { return; }
    const ref = attr(wsSource, 'ref');
    const sheet = attr(wsSource, 'sheet');
    const name = attr(wsSource, 'name');
    if (ref && sheet) {
      const worksheetSource: PivotCacheWorksheetSource = name ? { ref, sheet, name } : { ref, sheet };
      return { sourceType: 'worksheet', worksheetSource, fields };
    }
    if (name) {
      const worksheetSource: PivotCacheWorksheetSource = sheet ? { name, sheet } : { name };
      return { sourceType: 'worksheet', worksheetSource, fields };
    }
    return;
  }

  if (sourceType === 'external') {
    const connectionId = numAttr(cacheSource, 'connectionId');
    if (connectionId == null) { return; }
    return { sourceType: 'external', connectionId, fields };
  }

  if (sourceType === 'consolidation') {
    const consolidationEl = cacheSource.getElementsByTagName('consolidation')[0];
    if (!consolidationEl) { return; }
    const autoPage = boolAttr(consolidationEl, 'autoPage');
    const pages: string[][] = [];
    for (const pageEl of consolidationEl.querySelectorAll('pages > page')) {
      const items: string[] = [];
      for (const itemEl of pageEl.getElementsByTagName('pageItem')) {
        items.push(attr(itemEl, 'name'));
      }
      pages.push(items);
    }
    const rangeSets: PivotCacheConsolidationRangeSet[] = [];
    for (const rsEl of consolidationEl.querySelectorAll('rangeSets > rangeSet')) {
      const rs: PivotCacheConsolidationRangeSet = { ref: attr(rsEl, 'ref') };
      const sheet = attr(rsEl, 'sheet');
      if (sheet) { rs.sheet = sheet; }
      const i1 = numAttr(rsEl, 'i1');
      if (i1 != null) { rs.i1 = i1; }
      const i2 = numAttr(rsEl, 'i2');
      if (i2 != null) { rs.i2 = i2; }
      const i3 = numAttr(rsEl, 'i3');
      if (i3 != null) { rs.i3 = i3; }
      const i4 = numAttr(rsEl, 'i4');
      if (i4 != null) { rs.i4 = i4; }
      rangeSets.push(rs);
    }
    return {
      sourceType: 'consolidation',
      consolidation: {
        ...(autoPage != null ? { autoPage } : {}),
        ...(pages.length > 0 ? { pages } : {}),
        rangeSets,
      },
      fields,
    };
  }

  if (sourceType === 'scenario') {
    return { sourceType: 'scenario', fields };
  }
}

function parseFields (root: Element): PivotCacheField[] {
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
  return fields;
}
