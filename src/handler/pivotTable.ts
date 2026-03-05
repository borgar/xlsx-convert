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
  if (value == null) {
    return undefined;
  }
  return allowed.has(value as T) ? (value as T) : undefined;
}

/** Set boolean properties on target when the XML attribute has the given non-default value. */
function readBoolAttrs (
  target: Record<string, unknown>, el: Element, specs: readonly [string, boolean][],
): void {
  for (const [ prop, nonDefault ] of specs) {
    if (boolAttr(el, prop) === nonDefault) {
      target[prop] = nonDefault;
    }
  }
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
    if (itemIndices.length > 0) {
      item.itemIndices = itemIndices;
    }
    if (itemType != null) {
      item.itemType = itemType;
    }
    if (repeatedItemCount !== 0) {
      item.repeatedItemCount = repeatedItemCount;
    }
    const dataFieldIndex = numAttr(el, 'i', 0);
    if (dataFieldIndex !== 0) {
      item.dataFieldIndex = dataFieldIndex;
    }
    items.push(item);
  }
  return items;
}

export function handlerPivotTable (dom: Document): PivotTable | undefined {
  const root = dom.getElementsByTagName('pivotTableDefinition')[0];
  if (!root) {
    return;
  }

  const name = attr(root, 'name');
  if (!name) {
    return;
  }

  const locationEl = root.getElementsByTagName('location')[0];
  if (!locationEl) {
    return;
  }

  const ref = attr(locationEl, 'ref');
  if (!ref) {
    return;
  }
  const firstHeaderRow = numAttr(locationEl, 'firstHeaderRow', 1);
  const firstDataRow = numAttr(locationEl, 'firstDataRow', 1);
  const firstDataCol = numAttr(locationEl, 'firstDataCol', 0);

  // Parse pivot fields
  const fields: PivotField[] = [];
  for (const pf of root.querySelectorAll('pivotFields > pivotField')) {
    const field: PivotField = {};
    const axis = attr(pf, 'axis');
    if (axis === 'axisRow') {
      field.axis = 'row';
    }
    else if (axis === 'axisCol') {
      field.axis = 'col';
    }
    else if (axis === 'axisPage') {
      field.axis = 'page';
    }
    // check for explicit subtotal attributes on the field
    const subtotalFunctions: PivotSubtotalFunction[] = [];
    for (const fn of SUBTOTAL_ATTRS) {
      const attrName =
        fn === 'countA'
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
        if (x != null) {
          fi.itemIndex = x;
        }
        const t = parseEnum(attr(item, 't'), ITEM_TYPES);
        if (t != null) {
          fi.itemType = t;
        }
        const h = boolAttr(item, 'h');
        if (h === true) {
          fi.hidden = true;
        }
        const n = attr(item, 'n');
        if (n != null) {
          fi.name = n;
        }
        if (boolAttr(item, 'sd') === false) {
          fi.expanded = false;
        }
        items.push(fi);
      }
      if (items.length > 0) {
        field.items = items;
      }
    }

    // Boolean field attributes (non-default values only)
    readBoolAttrs(field, pf, [
      [ 'dataField', true ],
      [ 'showAll', false ],
      // Layout mode
      [ 'compact', false ],
      [ 'outline', false ],
      [ 'subtotalTop', false ],
      [ 'insertBlankRow', true ],
      // Subtotal control
      [ 'defaultSubtotal', false ],
      // UI/drag behavior
      [ 'showDropDowns', false ],
      [ 'dragToRow', false ],
      [ 'dragToCol', false ],
      [ 'dragToPage', false ],
      [ 'dragToData', false ],
      [ 'dragOff', false ],
      [ 'multipleItemSelectionAllowed', true ],
      [ 'insertPageBreak', true ],
      [ 'hideNewItems', true ],
      [ 'includeNewItemsInFilter', true ],
      // Auto-show
      [ 'autoShow', true ],
      [ 'topAutoShow', false ],
      // Sort
      [ 'nonAutoSortDefault', true ],
      // OLAP-specific
      [ 'hiddenLevel', true ],
      [ 'allDrilled', true ],
      [ 'serverField', true ],
      [ 'measureFilter', true ],
      [ 'showPropCell', true ],
      [ 'showPropTip', true ],
      [ 'showPropAsCaption', true ],
      [ 'defaultAttributeDrillState', true ],
    ]);

    // Non-boolean field attributes
    const subtotalCaption = attr(pf, 'subtotalCaption');
    if (subtotalCaption != null) { field.subtotalCaption = subtotalCaption; }
    const pfNumFmtId = numAttr(pf, 'numFmtId');
    if (pfNumFmtId != null) { field.numFmtId = pfNumFmtId; }
    const itemPageCount = numAttr(pf, 'itemPageCount');
    if (itemPageCount != null && itemPageCount !== 10) { field.itemPageCount = itemPageCount; }
    const dataSourceSort = boolAttr(pf, 'dataSourceSort');
    if (dataSourceSort != null) { field.dataSourceSort = dataSourceSort; }
    const rankBy = numAttr(pf, 'rankBy');
    if (rankBy != null) { field.rankBy = rankBy; }
    const uniqueMemberProperty = attr(pf, 'uniqueMemberProperty');
    if (uniqueMemberProperty != null) { field.uniqueMemberProperty = uniqueMemberProperty; }

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
      name: attr(df, 'name') ?? '',
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
    if (baseField != null) {
      dataField.baseField = baseField;
    }
    const baseItem = numAttr(df, 'baseItem');
    if (baseItem != null) {
      dataField.baseItem = baseItem;
    }
    const numFmtId = numAttr(df, 'numFmtId');
    if (numFmtId != null) {
      dataField.numFmtId = numFmtId;
    }
    dataFields.push(dataField);
  }

  // Page fields
  const pageFields: PivotPageField[] = [];
  for (const pf of root.querySelectorAll('pageFields > pageField')) {
    const pageField: PivotPageField = {
      fieldIndex: numAttr(pf, 'fld', 0),
    };
    const item = numAttr(pf, 'item');
    if (item != null) {
      pageField.selectedItem = item;
    }
    const pfName = attr(pf, 'name');
    if (pfName) {
      pageField.name = pfName;
    }
    const pfCaption = attr(pf, 'cap');
    if (pfCaption != null) {
      pageField.caption = pfCaption;
    }
    const pfHier = numAttr(pf, 'hier');
    if (pfHier != null) {
      pageField.hierarchy = pfHier;
    }
    pageFields.push(pageField);
  }

  // Style
  let style: PivotTableStyle | undefined;
  const styleInfo = root.getElementsByTagName('pivotTableStyleInfo')[0];
  if (styleInfo) {
    style = {};
    const styleName = attr(styleInfo, 'name');
    if (styleName) {
      style.name = styleName;
    }
    const showRowHeaders = boolAttr(styleInfo, 'showRowHeaders');
    if (showRowHeaders != null) {
      style.showRowHeaders = showRowHeaders;
    }
    const showColHeaders = boolAttr(styleInfo, 'showColHeaders');
    if (showColHeaders != null) {
      style.showColHeaders = showColHeaders;
    }
    const showRowStripes = boolAttr(styleInfo, 'showRowStripes');
    if (showRowStripes != null) {
      style.showRowStripes = showRowStripes;
    }
    const showColStripes = boolAttr(styleInfo, 'showColStripes');
    if (showColStripes != null) {
      style.showColStripes = showColStripes;
    }
    const showLastColumn = boolAttr(styleInfo, 'showLastColumn');
    if (showLastColumn != null) {
      style.showLastColumn = showLastColumn;
    }
  }

  // Grand totals
  const rowGrandTotals = boolAttr(root, 'rowGrandTotals');
  const colGrandTotals = boolAttr(root, 'colGrandTotals');
  const autoRefresh = boolAttr(root, 'autoRefresh');

  const location: PivotTable['location'] = { firstHeaderRow, firstDataRow, firstDataCol };
  const rowPageCount = numAttr(locationEl, 'rowPageCount', 0);
  if (rowPageCount !== 0) { location.rowPageCount = rowPageCount; }
  const colPageCount = numAttr(locationEl, 'colPageCount', 0);
  if (colPageCount !== 0) { location.colPageCount = colPageCount; }

  const pt: PivotTable = {
    name,
    sheet: '', // resolved by caller
    cacheIndex: -1, // sentinel: resolved by caller; kept only if >= 0
    ref,
    location,
    fields,
  };

  if (rowFieldIndices.length > 0) {
    pt.rowFieldIndices = rowFieldIndices;
  }
  if (colFieldIndices.length > 0) {
    pt.colFieldIndices = colFieldIndices;
  }
  if (dataFields.length > 0) {
    pt.dataFields = dataFields;
  }
  if (pageFields.length > 0) {
    pt.pageFields = pageFields;
  }
  if (rowItems.length > 0) {
    pt.rowItems = rowItems;
  }
  if (colItems.length > 0) {
    pt.colItems = colItems;
  }
  if (style) {
    pt.style = style;
  }
  if (rowGrandTotals != null) {
    pt.rowGrandTotals = rowGrandTotals;
  }
  if (colGrandTotals != null) {
    pt.colGrandTotals = colGrandTotals;
  }
  if (autoRefresh != null) {
    pt.autoRefresh = autoRefresh;
  }

  // Boolean table-level attributes (non-default values only)
  readBoolAttrs(pt, root, [
    // Layout defaults
    [ 'compact', false ],
    [ 'outline', true ],
    [ 'outlineData', true ],
    [ 'compactData', false ],
    [ 'gridDropZones', true ],
    // Data axis
    [ 'dataOnRows', true ],
    // Display options
    [ 'showHeaders', false ],
    [ 'showEmptyRow', true ],
    [ 'showEmptyCol', true ],
    [ 'showDropZones', false ],
    // Captions
    [ 'showError', true ],
    [ 'showMissing', false ],
    // Behavior
    [ 'subtotalHiddenItems', true ],
    [ 'fieldPrintTitles', true ],
    [ 'itemPrintTitles', true ],
    [ 'mergeItem', true ],
    [ 'customListSort', false ],
    [ 'multipleFieldFilters', false ],
    [ 'preserveFormatting', false ],
    [ 'pageOverThenDown', true ],
  ]);

  // Non-boolean table-level attributes
  const indent = numAttr(root, 'indent');
  if (indent != null && indent !== 1) { pt.indent = indent; }
  const dataPosition = numAttr(root, 'dataPosition');
  if (dataPosition != null) { pt.dataPosition = dataPosition; }
  const dataCaption = attr(root, 'dataCaption');
  if (dataCaption != null) { pt.dataCaption = dataCaption; }
  const grandTotalCaption = attr(root, 'grandTotalCaption');
  if (grandTotalCaption != null) { pt.grandTotalCaption = grandTotalCaption; }
  const errorCaption = attr(root, 'errorCaption');
  if (errorCaption != null) { pt.errorCaption = errorCaption; }
  const missingCaption = attr(root, 'missingCaption');
  if (missingCaption != null) { pt.missingCaption = missingCaption; }
  const rowHeaderCaption = attr(root, 'rowHeaderCaption');
  if (rowHeaderCaption != null) { pt.rowHeaderCaption = rowHeaderCaption; }
  const colHeaderCaption = attr(root, 'colHeaderCaption');
  if (colHeaderCaption != null) { pt.colHeaderCaption = colHeaderCaption; }
  const pageWrap = numAttr(root, 'pageWrap', 0);
  if (pageWrap !== 0) { pt.pageWrap = pageWrap; }

  return pt;
}
