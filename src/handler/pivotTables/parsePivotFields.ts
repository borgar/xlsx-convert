import type { Element } from '@borgar/simple-xml';
import type { PivotField, PivotFieldItem, PivotSubtotalFunction } from '@jsfkit/types';
import { addProp } from '../../utils/addProp.ts';
import { attr, boolAttr, numAttr } from '../../utils/attr.ts';
import { parseEnum } from '../../utils/parseEnum.ts';
import type { NumFmtLookup } from './NumFmtLookup.ts';
import { ITEM_TYPES, SUBTOTAL_FUNCTIONS } from './constants.ts';
import { parsePivotArea } from './parsePivotArea.ts';
import { readBoolAttrs } from './readBoolAttrs.ts';
import { resolveNumFmt } from './resolveNumFmt.ts';

export function parsePivotFields (root: Element, numFmts?: NumFmtLookup): PivotField[] {
  const fields: PivotField[] = [];
  for (const pf of root.querySelectorAll('pivotFields > pivotField')) {
    const field: PivotField = {};
    addProp(field, 'name', attr(pf, 'name'));
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
        addProp(fi, 'itemIndex', numAttr(item, 'x'));
        addProp(fi, 'itemType', parseEnum(attr(item, 't'), ITEM_TYPES));
        const h = boolAttr(item, 'h');
        if (h === true) {
          fi.hidden = true;
        }
        addProp(fi, 'name', attr(item, 'n'));
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

    addProp(field, 'subtotalCaption', attr(pf, 'subtotalCaption'));
    addProp(field, 'numFmt', resolveNumFmt(pf, numFmts));
    addProp(field, 'itemPageCount', numAttr(pf, 'itemPageCount'), 10);
    addProp(field, 'dataSourceSort', boolAttr(pf, 'dataSourceSort'));
    addProp(field, 'rankBy', numAttr(pf, 'rankBy'));
    addProp(field, 'uniqueMemberProperty', attr(pf, 'uniqueMemberProperty'));

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
