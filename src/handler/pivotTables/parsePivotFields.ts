import type { Element } from '@borgar/simple-xml';
import type { PivotField, PivotFieldItem, PivotSubtotalFunction } from '@jsfkit/types';
import { attr, boolAttr, numAttr } from '../../utils/attr.ts';
import { parseEnum } from '../../utils/parseEnum.ts';
import type { NumFmtLookup } from './NumFmtLookup.ts';
import { ITEM_TYPES, SUBTOTAL_FUNCTIONS } from './constants.ts';
import { parsePivotArea } from './parsePivotArea.ts';
import { readBoolAttrs } from './readBoolAttrs.ts';

export function parsePivotFields (root: Element, numFmts?: NumFmtLookup): PivotField[] {
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

    const itemsContainer = pf.querySelector('items');
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
    const pfNumFmtId = numAttr(pf, 'numFmtId');
    if (pfNumFmtId != null && numFmts) {
      const fmt = numFmts[pfNumFmtId];
      if (typeof fmt === 'string' && fmt.toLowerCase() !== 'general') {
        field.numFmt = fmt;
      }
    }
    const itemPageCount = numAttr(pf, 'itemPageCount');
    if (itemPageCount != null && itemPageCount !== 10) { field.itemPageCount = itemPageCount; }
    const dataSourceSort = boolAttr(pf, 'dataSourceSort');
    if (dataSourceSort != null) { field.dataSourceSort = dataSourceSort; }
    const rankBy = numAttr(pf, 'rankBy');
    if (rankBy != null) { field.rankBy = rankBy; }
    const uniqueMemberProperty = attr(pf, 'uniqueMemberProperty');
    if (uniqueMemberProperty != null) { field.uniqueMemberProperty = uniqueMemberProperty; }

    // autoSortScope: pivot area defining the sort key
    const autoSortScopeEl = pf.querySelector('autoSortScope');
    if (autoSortScopeEl) {
      const pivotAreaEl = autoSortScopeEl.querySelector('pivotArea');
      if (pivotAreaEl) {
        field.autoSortScope = parsePivotArea(pivotAreaEl);
      }
    }

    fields.push(field);
  }
  return fields;
}
