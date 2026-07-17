import type { Element } from '@borgar/simple-xml';
import type { ConversionContext } from '../../ConversionContext.ts';
import { numValElm } from './utils/valElm.ts';
import { readMarker } from './readMarker.ts';
import { readShapeProperties } from '../drawings/readShapeProperties.ts';
import { readTextProps } from './readTextProps.ts';
import { getFirstChild } from '../../utils/getFirstChild.ts';
import { addProp } from '../../utils/addProp.ts';
import type { PivotFmts } from './types/PivotFmts.ts';
import type { PivotFmt } from './types/PivotFmt.ts';

/**
 * Read `<c:pivotFmts>`: the per-series/point formats a pivot chart persists across pivot
 * refreshes. Excel regenerates the `<c:ser>` elements from the pivot on load, so these entries
 * are the only formatting that survives — e.g. an explicit "no markers" choice lives here.
 * (`dLbl` children are not read yet.)
 */
export function readPivotFmts (element: Element, context: ConversionContext): PivotFmts | undefined {
  const pivotFmt: PivotFmt[] = [];
  for (const child of element.children) {
    if (child.tagName !== 'pivotFmt') { continue; }
    const idx = numValElm(getFirstChild(child, 'idx')!);
    if (idx == null) { continue; }
    const fmt: PivotFmt = { idx };
    const spPr = getFirstChild(child, 'spPr');
    if (spPr) {
      addProp(fmt, 'shape', readShapeProperties(spPr, context));
    }
    const marker = getFirstChild(child, 'marker');
    if (marker) {
      addProp(fmt, 'marker', readMarker(marker, context));
    }
    const txPr = getFirstChild(child, 'txPr');
    if (txPr) {
      addProp(fmt, 'textProps', readTextProps(txPr, context));
    }
    pivotFmt.push(fmt);
  }
  return pivotFmt.length ? { pivotFmt } : undefined;
}
