import { Element } from '@borgar/simple-xml';
import type { ConversionContext } from '../../ConversionContext.ts';
import { boolValElm, numValElm } from './utils/valElm.ts';
import { readShapeProperties } from '../drawings/readShapeProperties.ts';
import type { DPt } from './types/datalabels/DPt.ts';
import { readMarker } from './readMarker.ts';
import { readPictureOptions } from './read3d.ts';
import { addProp } from '../../utils/addProp.ts';

/**
 * Read a legacy data point override (`c:dPt`). A data point without an `idx` is left out.
 */
export function readDataPoint (element: Element, context: ConversionContext): DPt | undefined {
  const dp: Partial<DPt> = {};
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
    else if (child.tagName === 'invertIfNegative') {
      addProp(dp, 'invertIfNegative', boolValElm(child));
    }
    else if (child.tagName === 'marker') {
      addProp(dp, 'marker', readMarker(child, context));
    }
    else if (child.tagName === 'pictureOptions') {
      addProp(dp, 'pictureOptions', readPictureOptions(child));
    }
  }
  if (dp.idx != null) {
    return dp as DPt;
  }
}
