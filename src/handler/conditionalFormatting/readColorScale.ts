import type { Element } from '@borgar/simple-xml';
import type { CFColorStop } from '@jsfkit/types';

import { readColor } from '../../color/readColor.ts';
import type { ConversionContext } from '../../ConversionContext.ts';
import { isValueThreshold } from './isValueThreshold.ts';
import { readThresholds } from './readThresholds.ts';

/**
 * Reads a `<colorScale>` element into colour stops. The element lists its `<cfvo>` thresholds and
 * then its `<color>` elements, and the two are paired up by position. A stop is dropped if its
 * colour can't be read or its threshold is one only data bars support (`autoMin`, `autoMax`).
 */
export function readColorScale (node: Element, context: ConversionContext): CFColorStop[] {
  const thresholds = readThresholds(node, context);
  const colors = node.children
    .filter(d => d.tagName === 'color')
    .map(d => readColor(d, context.theme));
  const stops: CFColorStop[] = [];
  for (let i = 0; i < Math.min(thresholds.length, colors.length); i++) {
    const threshold = thresholds[i];
    const color = colors[i];
    if (
      color &&
      (threshold.type === 'min' || threshold.type === 'max' || isValueThreshold(threshold))
    ) {
      stops.push({ ...threshold, color });
    }
  }
  return stops;
}
