import type { Document } from '@borgar/simple-xml';
import type { PivotTable } from '@jsfkit/types';
import { addProp } from '../utils/addProp.ts';
import { attr, boolAttr, numAttr } from '../utils/attr.ts';
import type { NumFmtLookup } from './pivotTables/NumFmtLookup.ts';
import type { PivotTableWithOptionalCache } from './pivotTables/PivotTableWithOptionalCache.ts';
import { parseDataFields } from './pivotTables/parseDataFields.ts';
import { parseFilters } from './pivotTables/parseFilters.ts';
import { parsePageFields } from './pivotTables/parsePageFields.ts';
import { parsePivotFields } from './pivotTables/parsePivotFields.ts';
import { parseRowColItems } from './pivotTables/parseRowColItems.ts';
import { parseStyle } from './pivotTables/parseStyle.ts';
import { readBoolAttrs } from './pivotTables/readBoolAttrs.ts';

export function handlerPivotTable (dom: Document, numFmts?: NumFmtLookup): PivotTableWithOptionalCache | undefined {
  const root = dom.querySelector('pivotTableDefinition');
  if (!root) {
    return;
  }

  const name = attr(root, 'name');
  if (!name) {
    return;
  }

  const locationEl = root.querySelector('location');
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

  const fields = parsePivotFields(root, numFmts);

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

  const dataFields = parseDataFields(root, numFmts);

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
  addProp(pt, 'rowGrandTotals', rowGrandTotals, true);
  addProp(pt, 'colGrandTotals', colGrandTotals, true);
  addProp(pt, 'autoRefresh', autoRefresh, false);

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
