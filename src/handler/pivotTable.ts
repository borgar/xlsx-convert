import type { Document, Element } from '@borgar/simple-xml';
import type {
  PivotAutoFilterColumn,
  PivotCustomFilterCriterion,
  PivotDataField,
  PivotDataFieldAggregation,
  PivotField,
  PivotFieldItem,
  PivotFilter,
  PivotFilterType,
  PivotItemType,
  PivotPageField,
  PivotRowColItem,
  PivotShowDataAs,
  PivotSubtotalFunction,
  PivotTable,
  PivotTableStyle,
  PivotTableStyleName,
} from '@jsfkit/types';
import { addProp } from '../utils/addProp.ts';
import { attr, boolAttr, numAttr } from '../utils/attr.ts';
import { parseEnum } from '../utils/parseEnum.ts';

/** Pivot table parsed from XML, before the cache has been resolved by the caller. */
type PivotTableWithOptionalCache = Omit<PivotTable, 'cache'> & { cache?: PivotTable['cache'] };

export function handlerPivotTable (dom: Document): PivotTableWithOptionalCache | undefined {
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

  const fields = parsePivotFields(root);

  const rowFieldIndices: number[] = [];
  for (const f of root.querySelectorAll('rowFields > field')) {
    rowFieldIndices.push(numAttr(f, 'x', 0));
  }

  const colFieldIndices: number[] = [];
  for (const f of root.querySelectorAll('colFields > field')) {
    colFieldIndices.push(numAttr(f, 'x', 0));
  }

  const rowItems = parseRowColItems(root, 'rowItems > i');
  const colItems = parseRowColItems(root, 'colItems > i');

  const dataFields = parseDataFields(root);

  const pageFields = parsePageFields(root);

  const style = parseStyle(root);

  const rowGrandTotals = boolAttr(root, 'rowGrandTotals');
  const colGrandTotals = boolAttr(root, 'colGrandTotals');
  const autoRefresh = boolAttr(root, 'autoRefresh');

  const location: PivotTable['location'] = { firstHeaderRow, firstDataRow, firstDataCol };
  const rowPageCount = numAttr(locationEl, 'rowPageCount', 0);
  if (rowPageCount !== 0) { location.rowPageCount = rowPageCount; }
  const colPageCount = numAttr(locationEl, 'colPageCount', 0);
  if (colPageCount !== 0) { location.colPageCount = colPageCount; }

  const pt = {
    name,
    sheet: '', // resolved by caller
    ref,
    location,
    fields,
  } as PivotTableWithOptionalCache;

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
    [ 'showMemberPropertyTips', false ],
    [ 'enableDrill', false ],
    [ 'showMultipleLabel', false ],
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
    [ 'showItems', false ],
    [ 'showCalcMbrs', false ],
    [ 'preserveFormatting', false ],
    [ 'pageOverThenDown', true ],
  ]);

  // AutoFormat attributes (AG_AutoFormat attribute group)
  addProp(pt, 'autoFormatId', numAttr(root, 'autoFormatId'));
  addProp(pt, 'useAutoFormatting', boolAttr(root, 'useAutoFormatting'));
  addProp(pt, 'applyNumberFormats', boolAttr(root, 'applyNumberFormats'));
  addProp(pt, 'applyBorderFormats', boolAttr(root, 'applyBorderFormats'));
  addProp(pt, 'applyFontFormats', boolAttr(root, 'applyFontFormats'));
  addProp(pt, 'applyPatternFormats', boolAttr(root, 'applyPatternFormats'));
  addProp(pt, 'applyAlignmentFormats', boolAttr(root, 'applyAlignmentFormats'));
  addProp(pt, 'applyWidthHeightFormats', boolAttr(root, 'applyWidthHeightFormats'));

  addProp(pt, 'indent', numAttr(root, 'indent'), 1);
  addProp(pt, 'dataPosition', numAttr(root, 'dataPosition'));
  addProp(pt, 'dataCaption', attr(root, 'dataCaption'));
  addProp(pt, 'grandTotalCaption', attr(root, 'grandTotalCaption'));
  addProp(pt, 'errorCaption', attr(root, 'errorCaption'));
  addProp(pt, 'missingCaption', attr(root, 'missingCaption'));
  addProp(pt, 'rowHeaderCaption', attr(root, 'rowHeaderCaption'));
  addProp(pt, 'colHeaderCaption', attr(root, 'colHeaderCaption'));
  addProp(pt, 'pageWrap', numAttr(root, 'pageWrap'), 0);
  addProp(pt, 'uid', attr(root, 'xr:uid'));

  const filters = parseFilters(root);
  if (filters.length > 0) { pt.filters = filters; }

  const calculatedFields: PivotTable['calculatedFields'] = [];
  for (const cfEl of root.querySelectorAll('calculatedFields > calculatedField')) {
    const cfName = attr(cfEl, 'name');
    const cfFormula = attr(cfEl, 'formula');
    if (cfName != null && cfFormula != null) {
      calculatedFields.push({ name: cfName, formula: cfFormula });
    }
  }
  if (calculatedFields.length > 0) { pt.calculatedFields = calculatedFields; }

  return pt;
}

// --- Helper functions and constants ---

const SUBTOTAL_FUNCTIONS: PivotSubtotalFunction[] = [
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

const ITEM_TYPES: ReadonlySet<PivotItemType> = new Set<PivotItemType>([
  ...SUBTOTAL_FUNCTIONS, 'data', 'default', 'grand', 'blank',
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
    'index',
    'percentOfParentRow',
    'percentOfParentCol',
    'percentOfParent',
    'percentOfRunningTotal',
    'rankAscending',
    'rankDescending',
  ]);

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

function parsePivotFields (root: Element): PivotField[] {
  const fields: PivotField[] = [];
  for (const pf of root.querySelectorAll('pivotFields > pivotField')) {
    const field: PivotField = {};
    const pfName = attr(pf, 'name');
    if (pfName != null) { field.name = pfName; }
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
    for (const fn of SUBTOTAL_FUNCTIONS) {
      const attrName = fn + 'Subtotal';
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
        if (boolAttr(item, 'm') === true) {
          fi.missing = true;
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

    const subtotalCaption = attr(pf, 'subtotalCaption');
    if (subtotalCaption != null) { field.subtotalCaption = subtotalCaption; }
    // numFmtId is read from XML but not stored: the new type uses numFmt (a format
    // code string), which requires the style table to resolve. TODO: resolve when available.
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
  return fields;
}

function parseDataFields (root: Element): PivotDataField[] {
  const dataFields: PivotDataField[] = [];
  for (const df of root.querySelectorAll('dataFields > dataField')) {
    const dfName = attr(df, 'name');
    const dataField: PivotDataField = {
      ...(dfName != null ? { name: dfName } : {}),
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
    // numFmtId is read from XML but not stored: the new type uses numFmt (a format
    // code string), which requires the style table to resolve. TODO: resolve when available.
    dataFields.push(dataField);
  }
  return dataFields;
}

function parsePageFields (root: Element): PivotPageField[] {
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
  return pageFields;
}

function parseStyle (root: Element): PivotTableStyle | undefined {
  const styleInfo = root.getElementsByTagName('pivotTableStyleInfo')[0];
  if (!styleInfo) { return; }
  const style: PivotTableStyle = {};
  const styleName = attr(styleInfo, 'name');
  if (styleName) {
    // Cast is intentional: Excel allows user-defined custom pivot styles whose
    // names aren't in the PivotTableStyleName union. We preserve whatever name
    // the file contains rather than validating against the built-in list.
    style.name = styleName as PivotTableStyleName;
  }
  const showRowHeaders = boolAttr(styleInfo, 'showRowHeaders');
  if (showRowHeaders != null) {
    style.showRowHeaders = showRowHeaders;
  }
  const showColHeaders = boolAttr(styleInfo, 'showColHeaders');
  if (showColHeaders != null) {
    style.showColumnHeaders = showColHeaders;
  }
  const showRowStripes = boolAttr(styleInfo, 'showRowStripes');
  if (showRowStripes != null) {
    style.showRowStripes = showRowStripes;
  }
  const showColStripes = boolAttr(styleInfo, 'showColStripes');
  if (showColStripes != null) {
    style.showColumnStripes = showColStripes;
  }
  const showLastColumn = boolAttr(styleInfo, 'showLastColumn');
  if (showLastColumn != null) {
    style.showLastColumn = showLastColumn;
  }
  return style;
}

const FILTER_TYPES: ReadonlySet<PivotFilterType> = new Set<PivotFilterType>([
  'unknown',
  'count',
  'percent',
  'sum',
  'captionEqual',
  'captionNotEqual',
  'captionBeginsWith',
  'captionNotBeginsWith',
  'captionEndsWith',
  'captionNotEndsWith',
  'captionContains',
  'captionNotContains',
  'captionGreaterThan',
  'captionGreaterThanOrEqual',
  'captionLessThan',
  'captionLessThanOrEqual',
  'captionBetween',
  'captionNotBetween',
  'valueEqual',
  'valueNotEqual',
  'valueGreaterThan',
  'valueGreaterThanOrEqual',
  'valueLessThan',
  'valueLessThanOrEqual',
  'valueBetween',
  'valueNotBetween',
  'dateEqual',
  'dateNotEqual',
  'dateOlderThan',
  'dateOlderThanOrEqual',
  'dateNewerThan',
  'dateNewerThanOrEqual',
  'dateBetween',
  'dateNotBetween',
  'tomorrow',
  'today',
  'yesterday',
  'nextWeek',
  'thisWeek',
  'lastWeek',
  'nextMonth',
  'thisMonth',
  'lastMonth',
  'nextQuarter',
  'thisQuarter',
  'lastQuarter',
  'nextYear',
  'thisYear',
  'lastYear',
  'yearToDate',
  'Q1',
  'Q2',
  'Q3',
  'Q4',
  'M1',
  'M2',
  'M3',
  'M4',
  'M5',
  'M6',
  'M7',
  'M8',
  'M9',
  'M10',
  'M11',
  'M12',
]);

type CustomFilterOp = NonNullable<PivotCustomFilterCriterion['operator']>;
const CUSTOM_FILTER_OPS: ReadonlySet<CustomFilterOp> = new Set<CustomFilterOp>([
  'lessThan', 'lessThanOrEqual', 'equal', 'notEqual', 'greaterThanOrEqual', 'greaterThan',
]);

function parseFilters (root: Element): PivotFilter[] {
  const filters: PivotFilter[] = [];
  for (const fEl of root.querySelectorAll('filters > filter')) {
    const type = parseEnum(attr(fEl, 'type'), FILTER_TYPES);
    if (type == null) { continue; }
    const filter: PivotFilter = {
      fieldIndex: numAttr(fEl, 'fld', 0),
      type,
      id: numAttr(fEl, 'id', 0),
    };
    const evalOrder = numAttr(fEl, 'evalOrder');
    if (evalOrder != null && evalOrder !== 0) { filter.evalOrder = evalOrder; }
    const mpFld = numAttr(fEl, 'mpFld');
    if (mpFld != null) { filter.mpFld = mpFld; }
    const iMeasureHier = numAttr(fEl, 'iMeasureHier');
    if (iMeasureHier != null) { filter.iMeasureHier = iMeasureHier; }
    const iMeasureFld = numAttr(fEl, 'iMeasureFld');
    if (iMeasureFld != null) { filter.iMeasureFld = iMeasureFld; }
    const name = attr(fEl, 'name');
    if (name != null) { filter.name = name; }
    const description = attr(fEl, 'description');
    if (description != null) { filter.description = description; }
    const sv1 = attr(fEl, 'stringValue1');
    if (sv1 != null) { filter.stringValue1 = sv1; }
    const sv2 = attr(fEl, 'stringValue2');
    if (sv2 != null) { filter.stringValue2 = sv2; }

    const afEl = fEl.getElementsByTagName('autoFilter')[0];
    if (afEl) {
      const af: PivotFilter['autoFilter'] = {};
      const afRef = attr(afEl, 'ref');
      if (afRef != null) { af.ref = afRef; }
      const filterColumns: PivotAutoFilterColumn[] = [];
      for (const fcEl of afEl.getElementsByTagName('filterColumn')) {
        const fc: PivotAutoFilterColumn = { colId: numAttr(fcEl, 'colId', 0) };
        const top10El = fcEl.getElementsByTagName('top10')[0];
        if (top10El) {
          fc.top10 = { val: numAttr(top10El, 'val', 0) };
          const top = boolAttr(top10El, 'top');
          if (top === false) { fc.top10.top = false; }
          const percent = boolAttr(top10El, 'percent');
          if (percent === true) { fc.top10.percent = true; }
          const filterVal = numAttr(top10El, 'filterVal');
          if (filterVal != null) { fc.top10.filterVal = filterVal; }
        }
        const customFiltersEl = fcEl.getElementsByTagName('customFilters')[0];
        if (customFiltersEl) {
          const cfItems: NonNullable<PivotAutoFilterColumn['customFilters']>['filters'] = [];
          for (const cfItemEl of customFiltersEl.getElementsByTagName('customFilter')) {
            const f: (typeof cfItems)[number] = {};
            const op = parseEnum(attr(cfItemEl, 'operator'), CUSTOM_FILTER_OPS);
            if (op != null) {
              f.operator = op;
            }
            const val = attr(cfItemEl, 'val');
            if (val != null) { f.val = val; }
            cfItems.push(f);
          }
          const cf: NonNullable<PivotAutoFilterColumn['customFilters']> = { filters: cfItems };
          if (boolAttr(customFiltersEl, 'and') === true) { cf.and = true; }
          fc.customFilters = cf;
        }
        filterColumns.push(fc);
      }
      if (filterColumns.length > 0) { af.filterColumns = filterColumns; }
      filter.autoFilter = af;
    }

    filters.push(filter);
  }
  return filters;
}
