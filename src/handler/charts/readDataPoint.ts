import { Element } from '@borgar/simple-xml';
import type { ConversionContext } from '../../ConversionContext.ts';
import { boolValElm, numValElm } from './utils/valElm.ts';
import { readShapeProperties } from '../drawings/readShapeProperties.ts';
import type { DataPoint } from './types/seriesEx/DataPoint.ts';
import { addProp } from '../../utils/addProp.ts';

export function readDataPoint (element: Element, context: ConversionContext): DataPoint | undefined {
  const dp: Partial<DataPoint> = {};
  for (const child of element.children) {
    if (child.tagName === 'idx') {
      const val = numValElm(child);
      if (val !== null) { dp.idx = val; }
    }
    else if (child.tagName === 'spPr') {
      dp.shape = readShapeProperties(child, context);
    }
    else if (child.tagName === 'bubble3D') {
      addProp(dp, 'bubble3D', boolValElm(child), false);
    }
    else if (child.tagName === 'explosion') {
      addProp(dp, 'explosion', numValElm(child));
    }
  }
  if (dp.idx != null) {
    return dp as DataPoint;
  }
}
