import type { Element } from '@borgar/simple-xml';
import type { ConversionContext } from '../../ConversionContext.ts';
import type { Trendline } from './types/trendline/Trendline.ts';
import { addProp } from '../../utils/addProp.ts';
import { boolValElm, numValElm, strValElm } from './utils/valElm.ts';
import type { TrendlineType } from './types/trendline/TrendlineType.ts';
import { readShapeProperties } from '../drawings/readShapeProperties.ts';

export function readTrendline (elm: Element, context: ConversionContext): Trendline {
  const tl: Trendline = { type: 'linear' };

  for (const child of elm.children) {
    if (child.tagName === 'name') {
      tl.name = child.textContent;
    }
    else if (child.tagName === 'trendlineType') {
      addProp(tl, 'type', strValElm<TrendlineType>(child));
    }
    else if (child.tagName === 'order') {
      // min=2, max=6
      addProp(tl, 'order', numValElm(child), 2);
    }
    else if (child.tagName === 'forward') {
      addProp(tl, 'forward', numValElm(child));
    }
    else if (child.tagName === 'backward') {
      addProp(tl, 'backward', numValElm(child));
    }
    else if (child.tagName === 'period') {
      // min=2
      addProp(tl, 'period', numValElm(child), 2);
    }
    else if (child.tagName === 'intercept') {
      addProp(tl, 'intercept', numValElm(child));
    }
    else if (child.tagName === 'dispRSqr') {
      addProp(tl, 'dispRSqr', boolValElm(child), false);
    }
    else if (child.tagName === 'dispEq') {
      addProp(tl, 'dispEq', boolValElm(child), false);
    }
    else if (child.tagName === 'spPr') {
      addProp(tl, 'shape', readShapeProperties(child, context));
    }
    else if (child.tagName === 'label') { // TODO: TrendlineLbl
      // console.log(String(child));
    }
    else {
      // console.log(child.tagName);
    }
  }

  return tl;
}
