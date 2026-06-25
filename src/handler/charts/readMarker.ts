import { Element } from '@borgar/simple-xml';
import type { ConversionContext } from '../../ConversionContext.ts';
import { numValElm, strValElm } from './utils/valElm.ts';
import { readShapeProperties } from '../drawings/readShapeProperties.ts';
import type { Marker } from './types/marker/Marker.ts';
import type { MarkerStyle } from './types/marker/MarkerStyle.ts';

export function readMarker (element: Element, context: ConversionContext): Marker {
  const marker: Marker = {};
  for (const child of element.children) {
    if (child.tagName === 'symbol') {
      const val = strValElm<MarkerStyle>(child);
      if (val) { marker.symbol = val; }
    }
    else if (child.tagName === 'size') {
      const val = numValElm(child);
      if (val !== null) { marker.size = val; }
    }
    else if (child.tagName === 'spPr') {
      marker.shape = readShapeProperties(child, context);
    }
  }
  return marker;
}
