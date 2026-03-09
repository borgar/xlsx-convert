import type { Document, Element } from '@borgar/simple-xml';
import type { PivotCache, PivotCacheConsolidationRangeSet, PivotCacheField, PivotCacheFieldGroup, PivotCacheRangePr, PivotCacheSharedItem, PivotCacheSharedItemsMeta, PivotCacheWorksheetSource, PivotGroupBy } from '@jsfkit/types';
import { addProp } from '../utils/addProp.ts';
import { attr, boolAttr, numAttr } from '../utils/attr.ts';
import { parseEnum } from '../utils/parseEnum.ts';
import { serializeElement } from '../utils/serializeElement.ts';

export function handlerPivotCacheDefinition (dom: Document): PivotCache | undefined {
  const root = dom.getElementsByTagName('pivotCacheDefinition')[0];
  if (!root) { return; }

  const cacheSource = root.getElementsByTagName('cacheSource')[0];
  if (!cacheSource) { return; }

  const sourceType = attr(cacheSource, 'type');
  const fields = parseFields(root);

  // Cache metadata attributes
  const metadata = parseCacheMetadata(root);

  // Extension list (opaque pass-through)
  const extensions: string[] = [];
  for (const extEl of root.querySelectorAll('extLst > ext')) {
    extensions.push(serializeElement(extEl));
  }
  const extProps = extensions.length > 0 ? { extensions } : {};

  if (sourceType === 'worksheet') {
    const wsSource = cacheSource.getElementsByTagName('worksheetSource')[0];
    if (!wsSource) { return; }
    const ref = attr(wsSource, 'ref');
    const sheet = attr(wsSource, 'sheet');
    const name = attr(wsSource, 'name');
    if (ref && sheet) {
      const worksheetSource: PivotCacheWorksheetSource = name ? { ref, sheet, name } : { ref, sheet };
      return { sourceType: 'worksheet' as const, worksheetSource, fields, ...metadata, ...extProps };
    }
    if (name) {
      const worksheetSource: PivotCacheWorksheetSource = sheet ? { name, sheet } : { name };
      return { sourceType: 'worksheet' as const, worksheetSource, fields, ...metadata, ...extProps };
    }
    return;
  }

  if (sourceType === 'external') {
    const connectionId = numAttr(cacheSource, 'connectionId');
    if (connectionId == null) { return; }
    return { sourceType: 'external' as const, connectionId, fields, ...metadata, ...extProps };
  }

  if (sourceType === 'consolidation') {
    const consolidationEl = cacheSource.getElementsByTagName('consolidation')[0];
    if (!consolidationEl) { return; }
    const autoPage = boolAttr(consolidationEl, 'autoPage');
    const pages: string[][] = [];
    for (const pageEl of consolidationEl.querySelectorAll('pages > page')) {
      const items: string[] = [];
      for (const itemEl of pageEl.getElementsByTagName('pageItem')) {
        items.push(attr(itemEl, 'name') ?? '');
      }
      pages.push(items);
    }
    const rangeSets: PivotCacheConsolidationRangeSet[] = [];
    for (const rsEl of consolidationEl.querySelectorAll('rangeSets > rangeSet')) {
      const rs: PivotCacheConsolidationRangeSet = {};
      const rsRef = attr(rsEl, 'ref');
      if (rsRef) { rs.ref = rsRef; }
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
      sourceType: 'consolidation' as const,
      consolidation: {
        ...(autoPage != null ? { autoPage } : {}),
        ...(pages.length > 0 ? { pages } : {}),
        rangeSets,
      },
      fields,
      ...metadata,
      ...extProps,
    };
  }

  if (sourceType === 'scenario') {
    return { sourceType: 'scenario' as const, fields, ...metadata, ...extProps };
  }
}

function parseFields (root: Element): PivotCacheField[] {
  const fields: PivotCacheField[] = [];
  for (const cf of root.querySelectorAll('cacheFields > cacheField')) {
    const name = attr(cf, 'name');
    const numFmtId = numAttr(cf, 'numFmtId');
    const formula = attr(cf, 'formula');

    const field: PivotCacheField = { name: name ?? '' };
    if (numFmtId != null) {
      field.numFmtId = numFmtId;
    }
    if (formula) {
      field.formula = formula;
    }
    const databaseField = boolAttr(cf, 'databaseField');
    if (databaseField === false) {
      field.databaseField = false;
    }

    const sharedItemsEl = cf.getElementsByTagName('sharedItems')[0];
    if (sharedItemsEl) {
      const sharedItems = parseCacheItems(sharedItemsEl);
      if (sharedItems.length > 0) {
        field.sharedItems = sharedItems;
      }
      // The <sharedItems> element carries metadata attributes (containsNumber,
      // minValue, maxValue, etc.) describing the field's data types and value
      // ranges. When shared-item children exist, this metadata could be derived
      // by scanning them, but when the field has no shared items (all values
      // live only in the cache records) these attributes are the only source
      // of type/range information for the field.
      const meta = parseSharedItemsMeta(sharedItemsEl);
      if (meta) {
        field.sharedItemsMeta = meta;
      }
    }
    // Field grouping
    const fieldGroupEl = cf.getElementsByTagName('fieldGroup')[0];
    if (fieldGroupEl) {
      const fg = parseFieldGroup(fieldGroupEl);
      if (fg) { field.fieldGroup = fg; }
    }

    fields.push(field);
  }
  return fields;
}

/** Parse `<s>`, `<n>`, `<b>`, `<d>`, `<e>`, `<m>` children into shared/group items. */
function parseCacheItems (container: Element): PivotCacheSharedItem[] {
  const items: PivotCacheSharedItem[] = [];
  for (const child of container.children) {
    switch (child.tagName) {
      case 's':
        items.push({ type: 'string', value: attr(child, 'v') ?? '' });
        break;
      case 'n':
        items.push({ type: 'number', value: +(attr(child, 'v') ?? 0) });
        break;
      case 'b':
        items.push({ type: 'boolean', value: !!+(attr(child, 'v') ?? 0) });
        break;
      case 'd':
        items.push({ type: 'date', value: attr(child, 'v') ?? '' });
        break;
      case 'e':
        items.push({ type: 'error', value: attr(child, 'v') ?? '' });
        break;
      case 'm':
        items.push({ type: 'missing' });
        break;
    }
  }
  return items;
}

const GROUP_BY_VALUES: ReadonlySet<PivotGroupBy> = new Set<PivotGroupBy>([
  'range', 'seconds', 'minutes', 'hours', 'days', 'months', 'quarters', 'years',
]);

function parseFieldGroup (el: Element): PivotCacheFieldGroup | undefined {
  const fg: PivotCacheFieldGroup = {};
  let hasAny = false;
  const par = numAttr(el, 'par');
  if (par != null) { fg.par = par; hasAny = true; }
  const base = numAttr(el, 'base');
  if (base != null) { fg.base = base; hasAny = true; }

  // Numeric/date range grouping parameters (start, end, interval, groupBy)
  const rangePrEl = el.getElementsByTagName('rangePr')[0];
  if (rangePrEl) {
    const rp: PivotCacheRangePr = {};
    const autoStart = boolAttr(rangePrEl, 'autoStart');
    if (autoStart === false) { rp.autoStart = false; }
    const autoEnd = boolAttr(rangePrEl, 'autoEnd');
    if (autoEnd === false) { rp.autoEnd = false; }
    const groupBy = parseEnum(attr(rangePrEl, 'groupBy'), GROUP_BY_VALUES);
    if (groupBy != null && groupBy !== 'range') { rp.groupBy = groupBy; }
    const startNum = numAttr(rangePrEl, 'startNum');
    if (startNum != null) { rp.startNum = startNum; }
    const endNum = numAttr(rangePrEl, 'endNum');
    if (endNum != null) { rp.endNum = endNum; }
    const startDate = attr(rangePrEl, 'startDate');
    if (startDate != null) { rp.startDate = startDate; }
    const endDate = attr(rangePrEl, 'endDate');
    if (endDate != null) { rp.endDate = endDate; }
    const groupInterval = numAttr(rangePrEl, 'groupInterval');
    if (groupInterval != null && groupInterval !== 1) { rp.groupInterval = groupInterval; }
    fg.rangePr = rp;
    hasAny = true;
  }

  // Discrete grouping: maps each source item to a group-item index
  const discretePrEl = el.getElementsByTagName('discretePr')[0];
  if (discretePrEl) {
    const indices: number[] = [];
    for (const x of discretePrEl.getElementsByTagName('x')) {
      indices.push(numAttr(x, 'v', 0));
    }
    if (indices.length > 0) { fg.discretePr = indices; hasAny = true; }
  }

  // Group item labels (the display values for each group bucket)
  const groupItemsEl = el.getElementsByTagName('groupItems')[0];
  if (groupItemsEl) {
    const items = parseCacheItems(groupItemsEl);
    if (items.length > 0) { fg.groupItems = items; hasAny = true; }
  }

  return hasAny ? fg : undefined;
}

function parseSharedItemsMeta (el: Element): PivotCacheSharedItemsMeta | undefined {
  const meta: PivotCacheSharedItemsMeta = {};
  let hasAny = false;
  const boolMeta = (name: keyof PivotCacheSharedItemsMeta) => {
    const v = boolAttr(el, name);
    if (v != null) { (meta as Record<string, unknown>)[name] = v; hasAny = true; }
  };
  const numMeta = (name: keyof PivotCacheSharedItemsMeta) => {
    const v = numAttr(el, name);
    if (v != null) { (meta as Record<string, unknown>)[name] = v; hasAny = true; }
  };
  const strMeta = (name: keyof PivotCacheSharedItemsMeta) => {
    const v = attr(el, name);
    if (v != null) { (meta as Record<string, unknown>)[name] = v; hasAny = true; }
  };
  boolMeta('containsBlank');
  boolMeta('containsMixedTypes');
  boolMeta('containsSemiMixedTypes');
  boolMeta('containsString');
  boolMeta('containsNumber');
  boolMeta('containsInteger');
  boolMeta('containsDate');
  boolMeta('containsNonDate');
  numMeta('minValue');
  numMeta('maxValue');
  strMeta('minDate');
  strMeta('maxDate');
  return hasAny ? meta : undefined;
}

type CacheMetadata = {
  refreshedBy?: string;
  refreshedDate?: number;
  refreshedDateIso?: string;
  recordCount?: number;
  createdVersion?: number;
  refreshedVersion?: number;
  minRefreshableVersion?: number;
  saveData?: boolean;
  refreshOnLoad?: boolean;
  enableRefresh?: boolean;
  upgradeOnRefresh?: boolean;
  uid?: string;
};

function parseCacheMetadata (root: Element): CacheMetadata {
  const result: CacheMetadata = {};
  addProp(result, 'refreshedBy', attr(root, 'refreshedBy'));
  addProp(result, 'refreshedDate', numAttr(root, 'refreshedDate'));
  addProp(result, 'refreshedDateIso', attr(root, 'refreshedDateIso'));
  addProp(result, 'recordCount', numAttr(root, 'recordCount'));
  addProp(result, 'createdVersion', numAttr(root, 'createdVersion'));
  addProp(result, 'refreshedVersion', numAttr(root, 'refreshedVersion'));
  addProp(result, 'minRefreshableVersion', numAttr(root, 'minRefreshableVersion'));
  addProp(result, 'saveData', boolAttr(root, 'saveData'));
  addProp(result, 'refreshOnLoad', boolAttr(root, 'refreshOnLoad'));
  addProp(result, 'enableRefresh', boolAttr(root, 'enableRefresh'));
  addProp(result, 'upgradeOnRefresh', boolAttr(root, 'upgradeOnRefresh'));
  addProp(result, 'uid', attr(root, 'xr:uid'));
  return result;
}
