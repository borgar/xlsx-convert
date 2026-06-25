import type { Element } from '@borgar/simple-xml';
import type { ConversionContext } from '../../ConversionContext.ts';
import { boolValElm, strValElm } from './utils/valElm.ts';
import { addProp } from '../../utils/addProp.ts';
import { attr, boolAttr } from '../../utils/attr.ts';
import { readShapeProperties } from '../drawings/readShapeProperties.ts';
import type { Legend } from './types/legend/Legend.ts';
import type { LegendPos } from './types/legend/LegendPos.ts';
import { readTextProps } from './readTextProps.ts';
import { readLayout } from './readLayout.ts';

export function readLegend (element: Element, context: ConversionContext): Legend | undefined {
  const out: Legend = {};

  // ChartEx: position and overlay are attributes on the element itself
  const posAttr = attr(element, 'pos');
  if (posAttr != null) {
    addProp(out, 'pos', posAttr as LegendPos, 'r' as LegendPos);
  }

  addProp(out, 'overlay', boolAttr(element, 'overlay', true), false);

  for (const child of element.children) {
    if (child.tagName === 'legendPos') {
      addProp(out, 'pos', strValElm(child, 'r'), 'r');
    }
    else if (child.tagName === 'legendEntry') {
      const legendEntry_ = element.querySelectorAll('>legendEntry');
      if (legendEntry_.length) {
        // console.log(String(legendEntry_));
        // TODO:
        // out.legendEntry = legendEntry_.map(child => readLegendEntry(child, context));
      }
    }
    else if (child.tagName === 'layout') {
      addProp(out, 'layout', readLayout(child));
    }
    else if (child.tagName === 'overlay') {
      // true when omitted: false means that this may not overlap the chart
      addProp(out, 'overlay', boolValElm(child));
    }
    else if (child.tagName === 'spPr') {
      addProp(out, 'shape', readShapeProperties(child, context));
    }
    else if (child.tagName === 'txPr') {
      addProp(out, 'textProps', readTextProps(child, context));
    }
  }

  // overlay is true when omitted but we're flipping the default to false in JSF
  if (out.overlay == null) {
    out.overlay = true;
  }

  return out;
}
