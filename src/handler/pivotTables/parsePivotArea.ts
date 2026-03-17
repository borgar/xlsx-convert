import type { Element } from '@borgar/simple-xml';
import type { PivotArea, PivotAreaAxis, PivotAreaReference, PivotAreaType } from '@jsfkit/types';
import { attr, boolAttr, numAttr } from '../../utils/attr.ts';
import { parseEnum } from '../../utils/parseEnum.ts';

const AREA_TYPES: ReadonlySet<PivotAreaType> = new Set<PivotAreaType>([
  'none', 'normal', 'data', 'all', 'origin', 'button', 'topRight',
]);

const AXIS_VALUES = new Map<string, PivotAreaAxis>([
  [ 'axisRow', 'row' ],
  [ 'axisCol', 'col' ],
  [ 'axisPage', 'page' ],
  [ 'axisValues', 'values' ],
]);

/** Parse a `<pivotArea>` element into a PivotArea object. */
export function parsePivotArea (elm: Element): PivotArea {
  const area: PivotArea = {};
  const type = parseEnum(attr(elm, 'type'), AREA_TYPES);
  if (type != null && type !== 'normal') { area.type = type; }
  const field = numAttr(elm, 'field');
  if (field != null) { area.field = field; }
  if (boolAttr(elm, 'dataOnly') === false) { area.dataOnly = false; }
  if (boolAttr(elm, 'labelOnly') === true) { area.labelOnly = true; }
  if (boolAttr(elm, 'grandRow') === true) { area.grandRow = true; }
  if (boolAttr(elm, 'grandCol') === true) { area.grandCol = true; }
  if (boolAttr(elm, 'cacheIndex') === true) { area.cacheIndex = true; }
  if (boolAttr(elm, 'outline') === false) { area.outline = false; }
  const offset = attr(elm, 'offset');
  if (offset != null) { area.offset = offset; }
  if (boolAttr(elm, 'collapsedLevelsAreSubtotals') === true) { area.collapsedLevelsAreSubtotals = true; }
  const axisStr = attr(elm, 'axis');
  if (axisStr != null) {
    const axis = AXIS_VALUES.get(axisStr);
    if (axis) { area.axis = axis; }
  }
  const fieldPosition = numAttr(elm, 'fieldPosition');
  if (fieldPosition != null) { area.fieldPosition = fieldPosition; }

  // references
  const refsContainer = elm.getElementsByTagName('references')[0];
  if (refsContainer) {
    const refs: PivotAreaReference[] = [];
    for (const refEl of refsContainer.getElementsByTagName('reference')) {
      const ref: PivotAreaReference = {};
      const refField = numAttr(refEl, 'field');
      if (refField != null) { ref.field = refField; }
      if (boolAttr(refEl, 'selected') === false) { ref.selected = false; }
      if (boolAttr(refEl, 'byPosition') === true) { ref.byPosition = true; }
      if (boolAttr(refEl, 'relative') === true) { ref.relative = true; }
      // subtotal flags
      if (boolAttr(refEl, 'defaultSubtotal') === true) { ref.defaultSubtotal = true; }
      if (boolAttr(refEl, 'sumSubtotal') === true) { ref.sumSubtotal = true; }
      if (boolAttr(refEl, 'countASubtotal') === true) { ref.countASubtotal = true; }
      if (boolAttr(refEl, 'avgSubtotal') === true) { ref.avgSubtotal = true; }
      if (boolAttr(refEl, 'maxSubtotal') === true) { ref.maxSubtotal = true; }
      if (boolAttr(refEl, 'minSubtotal') === true) { ref.minSubtotal = true; }
      if (boolAttr(refEl, 'productSubtotal') === true) { ref.productSubtotal = true; }
      if (boolAttr(refEl, 'countSubtotal') === true) { ref.countSubtotal = true; }
      if (boolAttr(refEl, 'stdDevSubtotal') === true) { ref.stdDevSubtotal = true; }
      if (boolAttr(refEl, 'stdDevPSubtotal') === true) { ref.stdDevPSubtotal = true; }
      if (boolAttr(refEl, 'varSubtotal') === true) { ref.varSubtotal = true; }
      if (boolAttr(refEl, 'varPSubtotal') === true) { ref.varPSubtotal = true; }
      // item indices
      const indices: number[] = [];
      for (const x of refEl.getElementsByTagName('x')) {
        indices.push(numAttr(x, 'v', 0));
      }
      if (indices.length > 0) { ref.itemIndices = indices; }
      refs.push(ref);
    }
    if (refs.length > 0) { area.references = refs; }
  }

  return area;
}
