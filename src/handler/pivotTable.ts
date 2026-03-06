import type { Document, Element } from '@borgar/simple-xml';
import type {
  PivotArea,
  PivotAreaReference,
  PivotAreaType,
  PivotAutoFilterColumn,
  PivotConditionalFormat,
  PivotConditionalFormatScope,
  PivotConditionalFormatType,
  PivotDataField,
  PivotDataFieldAggregation,
  PivotField,
  PivotFieldItem,
  PivotFilter,
  PivotFilterType,
  PivotFormat,
  PivotItemType,
  PivotPageField,
  PivotRowColItem,
  PivotShowDataAs,
  PivotSubtotalFunction,
  PivotTable,
  PivotTableStyle,
} from '@jsfkit/types';
import { attr, boolAttr, numAttr } from '../utils/attr.ts';
import { serializeElement } from '../utils/serializeElement.ts';

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
    'index',
    'percentOfParentRow',
    'percentOfParentCol',
    'percentOfParent',
    'percentOfRunningTotal',
    'rankAscending',
    'rankDescending',
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
    [ 'showMemberPropertyTips', false ],
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

  // AutoFormat attributes (AG_AutoFormat attribute group)
  const autoFormatId = numAttr(root, 'autoFormatId');
  if (autoFormatId != null) { pt.autoFormatId = autoFormatId; }
  const useAutoFormatting = boolAttr(root, 'useAutoFormatting');
  if (useAutoFormatting != null) { pt.useAutoFormatting = useAutoFormatting; }
  const applyNumberFormats = boolAttr(root, 'applyNumberFormats');
  if (applyNumberFormats != null) { pt.applyNumberFormats = applyNumberFormats; }
  const applyBorderFormats = boolAttr(root, 'applyBorderFormats');
  if (applyBorderFormats != null) { pt.applyBorderFormats = applyBorderFormats; }
  const applyFontFormats = boolAttr(root, 'applyFontFormats');
  if (applyFontFormats != null) { pt.applyFontFormats = applyFontFormats; }
  const applyPatternFormats = boolAttr(root, 'applyPatternFormats');
  if (applyPatternFormats != null) { pt.applyPatternFormats = applyPatternFormats; }
  const applyAlignmentFormats = boolAttr(root, 'applyAlignmentFormats');
  if (applyAlignmentFormats != null) { pt.applyAlignmentFormats = applyAlignmentFormats; }
  const applyWidthHeightFormats = boolAttr(root, 'applyWidthHeightFormats');
  if (applyWidthHeightFormats != null) { pt.applyWidthHeightFormats = applyWidthHeightFormats; }

  // Version tracking
  const createdVersion = numAttr(root, 'createdVersion');
  if (createdVersion != null) { pt.createdVersion = createdVersion; }
  const updatedVersion = numAttr(root, 'updatedVersion');
  if (updatedVersion != null) { pt.updatedVersion = updatedVersion; }
  const minRefreshableVersion = numAttr(root, 'minRefreshableVersion');
  if (minRefreshableVersion != null) { pt.minRefreshableVersion = minRefreshableVersion; }

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

  // Formats
  const formats = parseFormats(root);
  if (formats.length > 0) { pt.formats = formats; }

  // Conditional formats
  const conditionalFormats = parseConditionalFormats(root);
  if (conditionalFormats.length > 0) { pt.conditionalFormats = conditionalFormats; }

  // Filters
  const filters = parseFilters(root);
  if (filters.length > 0) { pt.filters = filters; }

  // Extension list (opaque pass-through)
  const extensions: string[] = [];
  for (const extEl of root.querySelectorAll('extLst > ext')) {
    extensions.push(serializeElement(extEl));
  }
  if (extensions.length > 0) { pt.extensions = extensions; }

  // Calculated fields
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

// --- Pivot area parsing (shared by formats, conditionalFormats) ---

const PIVOT_AREA_TYPES: ReadonlySet<PivotAreaType> = new Set<PivotAreaType>([
  'none', 'normal', 'data', 'all', 'origin', 'button', 'topRight',
]);

const AXIS_VALUES = new Set([ 'axisRow', 'axisCol', 'axisPage', 'axisValues' ]);

function parsePivotArea (el: Element): PivotArea {
  const area: PivotArea = {};
  const type = parseEnum(attr(el, 'type'), PIVOT_AREA_TYPES);
  if (type != null && type !== 'normal') { area.type = type; }
  const field = numAttr(el, 'field');
  if (field != null) { area.field = field; }
  if (boolAttr(el, 'dataOnly') === false) { area.dataOnly = false; }
  if (boolAttr(el, 'labelOnly') === true) { area.labelOnly = true; }
  if (boolAttr(el, 'grandRow') === true) { area.grandRow = true; }
  if (boolAttr(el, 'grandCol') === true) { area.grandCol = true; }
  if (boolAttr(el, 'cacheIndex') === true) { area.cacheIndex = true; }
  if (boolAttr(el, 'outline') === false) { area.outline = false; }
  const offset = attr(el, 'offset');
  if (offset != null) { area.offset = offset; }
  if (boolAttr(el, 'collapsedLevelsAreSubtotals') === true) { area.collapsedLevelsAreSubtotals = true; }
  const axis = attr(el, 'axis');
  if (axis != null && AXIS_VALUES.has(axis)) { area.axis = axis as PivotArea['axis']; }
  const fieldPosition = numAttr(el, 'fieldPosition');
  if (fieldPosition != null) { area.fieldPosition = fieldPosition; }

  const refs: PivotAreaReference[] = [];
  for (const refEl of el.querySelectorAll('references > reference')) {
    refs.push(parsePivotAreaReference(refEl));
  }
  if (refs.length > 0) { area.references = refs; }

  return area;
}

function parsePivotAreaReference (el: Element): PivotAreaReference {
  const ref: PivotAreaReference = {};
  const field = numAttr(el, 'field');
  if (field != null) { ref.field = field; }
  if (boolAttr(el, 'selected') === false) { ref.selected = false; }
  if (boolAttr(el, 'byPosition') === true) { ref.byPosition = true; }
  if (boolAttr(el, 'relative') === true) { ref.relative = true; }
  if (boolAttr(el, 'defaultSubtotal') === true) { ref.defaultSubtotal = true; }
  if (boolAttr(el, 'sumSubtotal') === true) { ref.sumSubtotal = true; }
  if (boolAttr(el, 'countASubtotal') === true) { ref.countASubtotal = true; }
  if (boolAttr(el, 'avgSubtotal') === true) { ref.avgSubtotal = true; }
  if (boolAttr(el, 'maxSubtotal') === true) { ref.maxSubtotal = true; }
  if (boolAttr(el, 'minSubtotal') === true) { ref.minSubtotal = true; }
  if (boolAttr(el, 'productSubtotal') === true) { ref.productSubtotal = true; }
  if (boolAttr(el, 'countSubtotal') === true) { ref.countSubtotal = true; }
  if (boolAttr(el, 'stdDevSubtotal') === true) { ref.stdDevSubtotal = true; }
  if (boolAttr(el, 'stdDevPSubtotal') === true) { ref.stdDevPSubtotal = true; }
  if (boolAttr(el, 'varSubtotal') === true) { ref.varSubtotal = true; }
  if (boolAttr(el, 'varPSubtotal') === true) { ref.varPSubtotal = true; }

  const indices: number[] = [];
  for (const x of el.getElementsByTagName('x')) {
    indices.push(numAttr(x, 'v', 0));
  }
  if (indices.length > 0) { ref.itemIndices = indices; }

  return ref;
}

// --- Formats ---

function parseFormats (root: Element): PivotFormat[] {
  const formats: PivotFormat[] = [];
  for (const fmtEl of root.querySelectorAll('formats > format')) {
    const fmt: PivotFormat = {
      pivotArea: { type: 'normal' },
    };
    const action = attr(fmtEl, 'action');
    if (action === 'blank') { fmt.action = 'blank'; }
    const dxfId = numAttr(fmtEl, 'dxfId');
    if (dxfId != null) { fmt.dxfId = dxfId; }
    const pivotAreaEl = fmtEl.getElementsByTagName('pivotArea')[0];
    if (pivotAreaEl) {
      fmt.pivotArea = parsePivotArea(pivotAreaEl);
    }
    formats.push(fmt);
  }
  return formats;
}

// --- Conditional formats ---

const CF_SCOPES: ReadonlySet<PivotConditionalFormatScope> =
  new Set<PivotConditionalFormatScope>([ 'selection', 'data', 'field' ]);
const CF_TYPES: ReadonlySet<PivotConditionalFormatType> =
  new Set<PivotConditionalFormatType>([ 'none', 'all', 'row', 'column' ]);

function parseConditionalFormats (root: Element): PivotConditionalFormat[] {
  const results: PivotConditionalFormat[] = [];
  for (const cfEl of root.querySelectorAll('conditionalFormats > conditionalFormat')) {
    const cf: PivotConditionalFormat = {
      priority: numAttr(cfEl, 'priority', 0),
      pivotAreas: [],
    };
    const scope = parseEnum(attr(cfEl, 'scope'), CF_SCOPES);
    if (scope != null && scope !== 'selection') { cf.scope = scope; }
    const type = parseEnum(attr(cfEl, 'type'), CF_TYPES);
    if (type != null && type !== 'none') { cf.type = type; }

    for (const paEl of cfEl.querySelectorAll('pivotAreas > pivotArea')) {
      cf.pivotAreas.push(parsePivotArea(paEl));
    }
    results.push(cf);
  }
  return results;
}

// --- Filters ---

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

const CUSTOM_FILTER_OPS = new Set([
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

    // Parse autoFilter child
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
            const op = attr(cfItemEl, 'operator');
            if (op != null && CUSTOM_FILTER_OPS.has(op)) {
              f.operator = op as (typeof f)['operator'];
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
