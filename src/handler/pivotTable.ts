import type { Document, Element } from '@borgar/simple-xml';
import type {
  PivotDataField,
  PivotDataFieldAggregation,
  PivotField,
  PivotFieldItem,
  PivotItemType,
  PivotPageField,
  PivotRowColItem,
  PivotShowDataAs,
  PivotSubtotalFunction,
  PivotTable,
  PivotTableStyle,
} from '@jsfkit/types';
import { attr, boolAttr, numAttr } from '../utils/attr.ts';

const SUBTOTAL_ATTRS: PivotSubtotalFunction[] = [
  'sum',
  'countA',
  'avg',
  'max',
  'min',
  'product',
  'count',
  'stdDev',
  'stdDevP',
  'var',
  'varP',
];

/** Parse a string as a member of a known set of enum values, returning undefined for unknown values. */
function parseEnum<T extends string> (
  value: string | null,
  allowed: ReadonlySet<T>,
): T | undefined {
  if (value == null) { return undefined; }
  return allowed.has(value as T) ? (value as T) : undefined;
}

const ITEM_TYPES: ReadonlySet<PivotItemType> = new Set<PivotItemType>([
  'data',
  'default',
  'sum',
  'countA',
  'avg',
  'max',
  'min',
  'product',
  'count',
  'stdDev',
  'stdDevP',
  'var',
  'varP',
  'grand',
  'blank',
]);

const DATA_FIELD_AGGREGATIONS: ReadonlySet<PivotDataFieldAggregation> =
  new Set<PivotDataFieldAggregation>([
    'average',
    'count',
    'countNums',
    'max',
    'min',
    'product',
    'stdDev',
    'stdDevP',
    'sum',
    'var',
    'varP',
  ]);

const SHOW_DATA_AS_VALUES: ReadonlySet<PivotShowDataAs> =
  new Set<PivotShowDataAs>([
    'normal',
    'difference',
    'percent',
    'percentDiff',
    'runTotal',
    'percentOfRow',
    'percentOfCol',
    'percentOfTotal',
    'percentOfParentRow',
    'percentOfParentCol',
    'percentOfParent',
    'index',
  ]);

function parseRowColItems (root: Element, selector: string): PivotRowColItem[] {
  const items: PivotRowColItem[] = [];
  for (const el of root.querySelectorAll(selector)) {
    const itemType = parseEnum(attr(el, 't'), ITEM_TYPES);
    const repeatedItemCount = numAttr(el, 'r', 0);
    const itemIndices: number[] = [];
    for (const x of el.getElementsByTagName('x')) {
      itemIndices.push(numAttr(x, 'v', 0));
    }
    const item: PivotRowColItem = {};
    if (itemIndices.length > 0) { item.itemIndices = itemIndices; }
    if (itemType != null) { item.itemType = itemType; }
    if (repeatedItemCount !== 0) { item.repeatedItemCount = repeatedItemCount; }
    items.push(item);
  }
  return items;
}

export function handlerPivotTable (dom: Document): PivotTable | undefined {
  const root = dom.getElementsByTagName('pivotTableDefinition')[0];
  if (!root) { return; }

  const name = attr(root, 'name');
  if (!name) { return; }

  const locationEl = root.getElementsByTagName('location')[0];
  if (!locationEl) { return; }

  const ref = attr(locationEl, 'ref');
  if (!ref) { return; }
  const firstHeaderRow = numAttr(locationEl, 'firstHeaderRow', 1);
  const firstDataRow = numAttr(locationEl, 'firstDataRow', 1);
  const firstDataCol = numAttr(locationEl, 'firstDataCol', 0);

  // Parse pivot fields
  const fields: PivotField[] = [];
  for (const pf of root.querySelectorAll('pivotFields > pivotField')) {
    const field: PivotField = {};
    const axis = attr(pf, 'axis');
    if (axis === 'axisRow') { field.axis = 'row'; }
    else if (axis === 'axisCol') { field.axis = 'col'; }
    else if (axis === 'axisPage') { field.axis = 'page'; }
    if (boolAttr(pf, 'dataField') === true) { field.dataField = true; }

    const showAll = boolAttr(pf, 'showAll');
    if (showAll === false) { field.showAll = false; }

    // check for explicit subtotal attributes on the field
    const subtotalFunctions: PivotSubtotalFunction[] = [];
    for (const fn of SUBTOTAL_ATTRS) {
      const attrName = fn === 'countA'
        ? 'countASubtotal'
        : fn === 'stdDev'
          ? 'stdDevSubtotal'
          : fn === 'stdDevP'
            ? 'stdDevPSubtotal'
            : fn + 'Subtotal';
      if (boolAttr(pf, attrName) === true) {
        subtotalFunctions.push(fn);
      }
    }
    if (subtotalFunctions.length > 0) {
      field.subtotalFunctions = subtotalFunctions;
    }

    const sortType = attr(pf, 'sortType');
    if (sortType === 'ascending' || sortType === 'descending') {
      field.sortType = sortType;
    }

    // Parse field items
    const itemsContainer = pf.getElementsByTagName('items')[0];
    if (itemsContainer) {
      const items: PivotFieldItem[] = [];
      for (const item of itemsContainer.getElementsByTagName('item')) {
        const fi: PivotFieldItem = {};
        const x = numAttr(item, 'x');
        if (x != null) { fi.itemIndex = x; }
        const t = parseEnum(attr(item, 't'), ITEM_TYPES);
        if (t != null) { fi.itemType = t; }
        const h = boolAttr(item, 'h');
        if (h === true) { fi.hidden = true; }
        items.push(fi);
      }
      if (items.length > 0) {
        field.items = items;
      }
    }

    fields.push(field);
  }

  // Row fields
  const rowFieldIndices: number[] = [];
  for (const f of root.querySelectorAll('rowFields > field')) {
    rowFieldIndices.push(numAttr(f, 'x', 0));
  }

  // Column fields
  const colFieldIndices: number[] = [];
  for (const f of root.querySelectorAll('colFields > field')) {
    colFieldIndices.push(numAttr(f, 'x', 0));
  }

  const rowItems = parseRowColItems(root, 'rowItems > i');
  const colItems = parseRowColItems(root, 'colItems > i');

  // Data fields
  const dataFields: PivotDataField[] = [];
  for (const df of root.querySelectorAll('dataFields > dataField')) {
    const dataField: PivotDataField = {
      name: attr(df, 'name'),
      fieldIndex: numAttr(df, 'fld', 0),
    };
    const subtotal = parseEnum(attr(df, 'subtotal'), DATA_FIELD_AGGREGATIONS);
    if (subtotal != null) {
      dataField.subtotal = subtotal;
    }
    const showDataAs = parseEnum(attr(df, 'showDataAs'), SHOW_DATA_AS_VALUES);
    if (showDataAs != null) {
      dataField.showDataAs = showDataAs;
    }
    const baseField = numAttr(df, 'baseField');
    if (baseField != null) { dataField.baseField = baseField; }
    const baseItem = numAttr(df, 'baseItem');
    if (baseItem != null) { dataField.baseItem = baseItem; }
    const numFmtId = numAttr(df, 'numFmtId');
    if (numFmtId != null) { dataField.numFmtId = numFmtId; }
    dataFields.push(dataField);
  }

  // Page fields
  const pageFields: PivotPageField[] = [];
  for (const pf of root.querySelectorAll('pageFields > pageField')) {
    const pageField: PivotPageField = {
      fieldIndex: numAttr(pf, 'fld', 0),
    };
    const item = numAttr(pf, 'item');
    if (item != null) { pageField.selectedItem = item; }
    const pfName = attr(pf, 'name');
    if (pfName) { pageField.name = pfName; }
    pageFields.push(pageField);
  }

  // Style
  let style: PivotTableStyle | undefined;
  const styleInfo = root.getElementsByTagName('pivotTableStyleInfo')[0];
  if (styleInfo) {
    style = {};
    const styleName = attr(styleInfo, 'name');
    if (styleName) { style.name = styleName; }
    const showRowHeaders = boolAttr(styleInfo, 'showRowHeaders');
    if (showRowHeaders != null) { style.showRowHeaders = showRowHeaders; }
    const showColHeaders = boolAttr(styleInfo, 'showColHeaders');
    if (showColHeaders != null) { style.showColHeaders = showColHeaders; }
    const showRowStripes = boolAttr(styleInfo, 'showRowStripes');
    if (showRowStripes != null) { style.showRowStripes = showRowStripes; }
    const showColStripes = boolAttr(styleInfo, 'showColStripes');
    if (showColStripes != null) { style.showColStripes = showColStripes; }
    const showLastColumn = boolAttr(styleInfo, 'showLastColumn');
    if (showLastColumn != null) { style.showLastColumn = showLastColumn; }
  }

  // Grand totals
  const rowGrandTotals = boolAttr(root, 'rowGrandTotals');
  const colGrandTotals = boolAttr(root, 'colGrandTotals');
  const autoRefresh = boolAttr(root, 'autoRefresh');

  const pt: PivotTable = {
    name,
    sheet: '', // resolved by caller
    cacheIndex: -1, // resolved by caller
    ref,
    location: { firstHeaderRow, firstDataRow, firstDataCol },
    fields,
  };

  if (rowFieldIndices.length > 0) { pt.rowFieldIndices = rowFieldIndices; }
  if (colFieldIndices.length > 0) { pt.colFieldIndices = colFieldIndices; }
  if (dataFields.length > 0) { pt.dataFields = dataFields; }
  if (pageFields.length > 0) { pt.pageFields = pageFields; }
  if (rowItems.length > 0) { pt.rowItems = rowItems; }
  if (colItems.length > 0) { pt.colItems = colItems; }
  if (style) { pt.style = style; }
  if (rowGrandTotals != null) { pt.rowGrandTotals = rowGrandTotals; }
  if (colGrandTotals != null) { pt.colGrandTotals = colGrandTotals; }
  if (autoRefresh != null) { pt.autoRefresh = autoRefresh; }

  return pt;
}
