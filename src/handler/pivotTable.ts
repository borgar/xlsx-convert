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

function parseItemType (value: string | null): PivotItemType | undefined {
  if (value == null) { return undefined; }
  // map OOXML item types to our type names
  const map: Record<string, PivotItemType> = {
    data: 'data',
    default: 'default',
    sum: 'sum',
    countA: 'countA',
    avg: 'avg',
    max: 'max',
    min: 'min',
    product: 'product',
    count: 'count',
    stdDev: 'stdDev',
    stdDevP: 'stdDevP',
    var: 'var',
    varP: 'varP',
    grand: 'grand',
    blank: 'blank',
  };
  return map[value];
}

function parseRowColItems (root: Element, selector: string): PivotRowColItem[] {
  const items: PivotRowColItem[] = [];
  for (const el of root.querySelectorAll(selector)) {
    const itemType = parseItemType(attr(el, 't'));
    const repeatedItemCount = numAttr(el, 'r', 0);
    const itemIndices: number[] = [];
    for (const x of el.getElementsByTagName('x')) {
      itemIndices.push(numAttr(x, 'v', 0));
    }
    const item: PivotRowColItem = { itemIndices };
    if (itemType != null) { item.itemType = itemType; }
    if (repeatedItemCount !== 0) { item.repeatedItemCount = repeatedItemCount; }
    items.push(item);
  }
  return items;
}

function parseSubtotal (value: string | null): PivotDataFieldAggregation | undefined {
  if (value == null) { return undefined; }
  const map: Record<string, PivotDataFieldAggregation> = {
    average: 'average',
    count: 'count',
    countNums: 'countNums',
    max: 'max',
    min: 'min',
    product: 'product',
    stdDev: 'stdDev',
    stdDevP: 'stdDevP',
    sum: 'sum',
    var: 'var',
    varP: 'varP',
  };
  return map[value];
}

function parseShowDataAs (value: string | null): PivotShowDataAs | undefined {
  if (value == null) { return undefined; }
  const map: Record<string, PivotShowDataAs> = {
    normal: 'normal',
    difference: 'difference',
    percent: 'percent',
    percentDiff: 'percentDiff',
    runTotal: 'runTotal',
    percentOfRow: 'percentOfRow',
    percentOfCol: 'percentOfCol',
    percentOfTotal: 'percentOfTotal',
    index: 'index',
  };
  return map[value];
}

export function handlerPivotTable (dom: Document): PivotTable | undefined {
  const root = dom.getElementsByTagName('pivotTableDefinition')[0];
  if (!root) { return; }

  const name = attr(root, 'name');
  if (!name) { return; }

  const locationEl = root.getElementsByTagName('location')[0];
  if (!locationEl) { return; }

  const ref = attr(locationEl, 'ref');
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
    else if (attr(pf, 'dataField') === '1') { field.axis = 'values'; }

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
        const t = parseItemType(attr(item, 't'));
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
    const subtotal = parseSubtotal(attr(df, 'subtotal'));
    if (subtotal != null) {
      dataField.subtotal = subtotal;
    }
    const showDataAs = parseShowDataAs(attr(df, 'showDataAs'));
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
