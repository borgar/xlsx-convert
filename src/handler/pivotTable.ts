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
    if (boolAttr(pf, 'dataField') === true) {
      field.dataField = true;
    }

    const showAll = boolAttr(pf, 'showAll');
    if (showAll === false) {
      field.showAll = false;
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

    // Layout mode
    if (boolAttr(pf, 'compact') === false) { field.compact = false; }
    if (boolAttr(pf, 'outline') === false) { field.outline = false; }
    if (boolAttr(pf, 'subtotalTop') === false) { field.subtotalTop = false; }
    if (boolAttr(pf, 'insertBlankRow') === true) { field.insertBlankRow = true; }

    // Subtotal control
    if (boolAttr(pf, 'defaultSubtotal') === false) { field.defaultSubtotal = false; }
    const subtotalCaption = attr(pf, 'subtotalCaption');
    if (subtotalCaption != null) { field.subtotalCaption = subtotalCaption; }

    // Number format
    const pfNumFmtId = numAttr(pf, 'numFmtId');
    if (pfNumFmtId != null) { field.numFmtId = pfNumFmtId; }

    // UI/drag behavior
    if (boolAttr(pf, 'showDropDowns') === false) { field.showDropDowns = false; }
    if (boolAttr(pf, 'dragToRow') === false) { field.dragToRow = false; }
    if (boolAttr(pf, 'dragToCol') === false) { field.dragToCol = false; }
    if (boolAttr(pf, 'dragToPage') === false) { field.dragToPage = false; }
    if (boolAttr(pf, 'dragToData') === false) { field.dragToData = false; }
    if (boolAttr(pf, 'dragOff') === false) { field.dragOff = false; }
    if (boolAttr(pf, 'multipleItemSelectionAllowed') === true) { field.multipleItemSelectionAllowed = true; }
    if (boolAttr(pf, 'insertPageBreak') === true) { field.insertPageBreak = true; }
    if (boolAttr(pf, 'hideNewItems') === true) { field.hideNewItems = true; }
    if (boolAttr(pf, 'includeNewItemsInFilter') === true) { field.includeNewItemsInFilter = true; }

    // Auto-show
    if (boolAttr(pf, 'autoShow') === true) { field.autoShow = true; }
    if (boolAttr(pf, 'topAutoShow') === false) { field.topAutoShow = false; }
    const itemPageCount = numAttr(pf, 'itemPageCount');
    if (itemPageCount != null && itemPageCount !== 10) { field.itemPageCount = itemPageCount; }

    // Sort (advanced)
    const dataSourceSort = boolAttr(pf, 'dataSourceSort');
    if (dataSourceSort != null) { field.dataSourceSort = dataSourceSort; }
    if (boolAttr(pf, 'nonAutoSortDefault') === true) { field.nonAutoSortDefault = true; }
    const rankBy = numAttr(pf, 'rankBy');
    if (rankBy != null) { field.rankBy = rankBy; }

    // OLAP-specific
    if (boolAttr(pf, 'hiddenLevel') === true) { field.hiddenLevel = true; }
    const uniqueMemberProperty = attr(pf, 'uniqueMemberProperty');
    if (uniqueMemberProperty != null) { field.uniqueMemberProperty = uniqueMemberProperty; }
    if (boolAttr(pf, 'allDrilled') === true) { field.allDrilled = true; }
    if (boolAttr(pf, 'serverField') === true) { field.serverField = true; }
    if (boolAttr(pf, 'measureFilter') === true) { field.measureFilter = true; }
    if (boolAttr(pf, 'showPropCell') === true) { field.showPropCell = true; }
    if (boolAttr(pf, 'showPropTip') === true) { field.showPropTip = true; }
    if (boolAttr(pf, 'showPropAsCaption') === true) { field.showPropAsCaption = true; }
    if (boolAttr(pf, 'defaultAttributeDrillState') === true) { field.defaultAttributeDrillState = true; }

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
    cacheIndex: -1, // resolved by caller
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

  // Layout defaults (table-level)
  if (boolAttr(root, 'compact') === false) { pt.compact = false; }
  if (boolAttr(root, 'outline') === true) { pt.outline = true; }
  if (boolAttr(root, 'outlineData') === true) { pt.outlineData = true; }
  if (boolAttr(root, 'compactData') === false) { pt.compactData = false; }
  if (boolAttr(root, 'gridDropZones') === true) { pt.gridDropZones = true; }
  const indent = numAttr(root, 'indent');
  if (indent != null && indent !== 1) { pt.indent = indent; }

  // Data axis
  if (boolAttr(root, 'dataOnRows') === true) { pt.dataOnRows = true; }
  const dataPosition = numAttr(root, 'dataPosition');
  if (dataPosition != null) { pt.dataPosition = dataPosition; }

  // Display options
  if (boolAttr(root, 'showHeaders') === false) { pt.showHeaders = false; }
  if (boolAttr(root, 'showEmptyRow') === true) { pt.showEmptyRow = true; }
  if (boolAttr(root, 'showEmptyCol') === true) { pt.showEmptyCol = true; }
  if (boolAttr(root, 'showDropZones') === false) { pt.showDropZones = false; }

  // Captions
  const dataCaption = attr(root, 'dataCaption');
  if (dataCaption != null) { pt.dataCaption = dataCaption; }
  const grandTotalCaption = attr(root, 'grandTotalCaption');
  if (grandTotalCaption != null) { pt.grandTotalCaption = grandTotalCaption; }
  const errorCaption = attr(root, 'errorCaption');
  if (errorCaption != null) { pt.errorCaption = errorCaption; }
  if (boolAttr(root, 'showError') === true) { pt.showError = true; }
  const missingCaption = attr(root, 'missingCaption');
  if (missingCaption != null) { pt.missingCaption = missingCaption; }
  if (boolAttr(root, 'showMissing') === false) { pt.showMissing = false; }
  const rowHeaderCaption = attr(root, 'rowHeaderCaption');
  if (rowHeaderCaption != null) { pt.rowHeaderCaption = rowHeaderCaption; }
  const colHeaderCaption = attr(root, 'colHeaderCaption');
  if (colHeaderCaption != null) { pt.colHeaderCaption = colHeaderCaption; }

  // Behavior
  if (boolAttr(root, 'subtotalHiddenItems') === true) { pt.subtotalHiddenItems = true; }
  if (boolAttr(root, 'fieldPrintTitles') === true) { pt.fieldPrintTitles = true; }
  if (boolAttr(root, 'itemPrintTitles') === true) { pt.itemPrintTitles = true; }
  if (boolAttr(root, 'mergeItem') === true) { pt.mergeItem = true; }
  if (boolAttr(root, 'customListSort') === false) { pt.customListSort = false; }
  if (boolAttr(root, 'multipleFieldFilters') === false) { pt.multipleFieldFilters = false; }
  if (boolAttr(root, 'preserveFormatting') === false) { pt.preserveFormatting = false; }
  const pageWrap = numAttr(root, 'pageWrap', 0);
  if (pageWrap !== 0) { pt.pageWrap = pageWrap; }
  if (boolAttr(root, 'pageOverThenDown') === true) { pt.pageOverThenDown = true; }

  return pt;
}
