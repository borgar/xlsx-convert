import type { Document, Element } from '@borgar/simple-xml';
import type { PivotCache, PivotCacheBase, PivotCacheConsolidationRangeSet, PivotCacheConsolidationSource, PivotCacheField, PivotCacheFieldGroup, PivotCacheRangePr, PivotCacheSharedItem, PivotCacheSharedItemsMeta, PivotCacheWorksheetSourceName, PivotCacheWorksheetSourceRange, PivotGroupBy } from '@jsfkit/types';
import { addProp } from '../utils/addProp.ts';
import { attr, boolAttr, numAttr } from '../utils/attr.ts';
import { parseCacheSharedItem } from '../utils/parseCacheSharedItem.ts';
import { parseEnum } from '../utils/parseEnum.ts';

/** Lookup table mapping numeric format IDs to format code strings. */
export type NumFmtLookup = Record<number, string>;

export function handlerPivotCacheDefinition (dom: Document, numFmts?: NumFmtLookup): PivotCache | undefined {
  const root = dom.getElementsByTagName('pivotCacheDefinition')[0];
  if (!root) { return; }

  const cacheSource = root.getElementsByTagName('cacheSource')[0];
  if (!cacheSource) { return; }

  const sourceType = attr(cacheSource, 'type');
  const fields = parseFields(root, numFmts);

  const metadata = parseCacheMetadata(root);

  let result: PivotCache | undefined;

  if (sourceType === 'worksheet') {
    const wsSource = cacheSource.getElementsByTagName('worksheetSource')[0];
    if (!wsSource) { return; }
    const ref = attr(wsSource, 'ref');
    const sheet = attr(wsSource, 'sheet');
    const name = attr(wsSource, 'name');
    if (ref) {
      // When both ref and name are present (e.g. a table-backed range), ref takes
      // precedence and name is dropped. PivotCacheWorksheetSourceRange doesn't have
      // a name field — the types model range and name sources as disjoint variants.
      const worksheetSource: PivotCacheWorksheetSourceRange = sheet
        ? { type: 'range', ref, sheet }
        : { type: 'range', ref };
      result = { sourceType: 'worksheet' as const, worksheetSource, fields };
    }
    else if (name) {
      const worksheetSource: PivotCacheWorksheetSourceName = sheet ? { type: 'name', name, sheet } : { type: 'name', name };
      result = { sourceType: 'worksheet' as const, worksheetSource, fields };
    }
  }
  else if (sourceType === 'external') {
    const connectionId = numAttr(cacheSource, 'connectionId');
    if (connectionId == null) { return; }
    result = { sourceType: 'external' as const, connectionId, fields };
  }
  else if (sourceType === 'consolidation') {
    const consolidationEl = cacheSource.querySelector('consolidation');
    if (!consolidationEl) { return; }
    const consolidation: PivotCacheConsolidationSource = { rangeSets: [] };
    addProp(consolidation, 'autoPage', boolAttr(consolidationEl, 'autoPage'));
    const pages: string[][] = [];
    for (const pageEl of consolidationEl.querySelectorAll('pages > page')) {
      const items: string[] = [];
      for (const itemEl of pageEl.getElementsByTagName('pageItem')) {
        items.push(attr(itemEl, 'name') ?? '');
      }
      pages.push(items);
    }
    if (pages.length > 0) { consolidation.pages = pages; }
    for (const rsEl of consolidationEl.querySelectorAll('rangeSets > rangeSet')) {
      const rs: PivotCacheConsolidationRangeSet = {};
      addProp(rs, 'ref', attr(rsEl, 'ref'));
      addProp(rs, 'sheet', attr(rsEl, 'sheet'));
      addProp(rs, 'i1', numAttr(rsEl, 'i1'));
      addProp(rs, 'i2', numAttr(rsEl, 'i2'));
      addProp(rs, 'i3', numAttr(rsEl, 'i3'));
      addProp(rs, 'i4', numAttr(rsEl, 'i4'));
      consolidation.rangeSets.push(rs);
    }
    result = { sourceType: 'consolidation' as const, consolidation, fields };
  }
  else if (sourceType === 'scenario') {
    result = { sourceType: 'scenario' as const, fields };
  }

  if (result) {
    Object.assign(result, metadata);
  }
  return result;
}

function parseFields (root: Element, numFmts?: NumFmtLookup): PivotCacheField[] {
  const fields: PivotCacheField[] = [];
  for (const cf of root.querySelectorAll('cacheFields > cacheField')) {
    const name = attr(cf, 'name');
    const formula = attr(cf, 'formula');

    const field: PivotCacheField = { name: name ?? '' };
    const numFmtId = numAttr(cf, 'numFmtId');
    if (numFmtId != null && numFmts) {
      const fmt = numFmts[numFmtId];
      if (typeof fmt === 'string' && fmt.toLowerCase() !== 'general') {
        field.numFmt = fmt;
      }
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
    const item = parseCacheSharedItem(child);
    if (item) { items.push(item); }
  }
  return items;
}

const GROUP_BY_VALUES: ReadonlySet<PivotGroupBy> = new Set<PivotGroupBy>([
  'range', 'seconds', 'minutes', 'hours', 'days', 'months', 'quarters', 'years',
]);

function parseFieldGroup (elm: Element): PivotCacheFieldGroup | undefined {
  const fg: PivotCacheFieldGroup = {};
  let hasAny = false;
  const par = numAttr(elm, 'par');
  if (par != null) { fg.par = par; hasAny = true; }
  const base = numAttr(elm, 'base');
  if (base != null) { fg.base = base; hasAny = true; }

  // Numeric/date range grouping parameters (start, end, interval, groupBy)
  const rangePrEl = elm.getElementsByTagName('rangePr')[0];
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
  const discretePrEl = elm.getElementsByTagName('discretePr')[0];
  if (discretePrEl) {
    const indices: number[] = [];
    for (const x of discretePrEl.getElementsByTagName('x')) {
      indices.push(numAttr(x, 'v', 0));
    }
    if (indices.length > 0) { fg.discretePr = indices; hasAny = true; }
  }

  // Group item labels (the display values for each group bucket)
  const groupItemsEl = elm.getElementsByTagName('groupItems')[0];
  if (groupItemsEl) {
    const items = parseCacheItems(groupItemsEl);
    if (items.length > 0) { fg.groupItems = items; hasAny = true; }
  }

  return hasAny ? fg : undefined;
}

function parseSharedItemsMeta (elm: Element): PivotCacheSharedItemsMeta | undefined {
  const meta: PivotCacheSharedItemsMeta = {};
  let hasAny = false;
  const boolMeta = (name: keyof PivotCacheSharedItemsMeta) => {
    const v = boolAttr(elm, name);
    if (v != null) { (meta as Record<string, unknown>)[name] = v; hasAny = true; }
  };
  const numMeta = (name: keyof PivotCacheSharedItemsMeta) => {
    const v = numAttr(elm, name);
    if (v != null) { (meta as Record<string, unknown>)[name] = v; hasAny = true; }
  };
  const strMeta = (name: keyof PivotCacheSharedItemsMeta) => {
    const v = attr(elm, name);
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

type CacheMetadata = Pick<PivotCacheBase,
  'refreshedBy' | 'refreshedDate' | 'refreshOnLoad' | 'enableRefresh' |
  'upgradeOnRefresh' | 'uid' | 'invalid'
>;

function parseCacheMetadata (root: Element): CacheMetadata {
  const result: CacheMetadata = {};
  addProp(result, 'refreshedBy', attr(root, 'refreshedBy'));
  addProp(result, 'refreshedDate', numAttr(root, 'refreshedDate'));
  addProp(result, 'refreshOnLoad', boolAttr(root, 'refreshOnLoad'));
  addProp(result, 'enableRefresh', boolAttr(root, 'enableRefresh'));
  addProp(result, 'upgradeOnRefresh', boolAttr(root, 'upgradeOnRefresh'));
  addProp(result, 'uid', attr(root, 'xr:uid'));
  addProp(result, 'invalid', boolAttr(root, 'invalid'));
  return result;
}
