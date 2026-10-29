import type { Element } from '@borgar/simple-xml';
import type { CFDataBarThreshold } from '@jsfkit/types';

import type { ConversionContext } from '../../ConversionContext.ts';
import { readThreshold } from './readThreshold.ts';

/**
 * Reads every `<cfvo>` child of a `<colorScale>`, `<dataBar>`, or `<iconSet>` element, in document
 * order. Thresholds of an unknown type are left out.
 */
export function readThresholds (node: Element, context: ConversionContext): CFDataBarThreshold[] {
  return node.children
    .filter(d => d.tagName === 'cfvo')
    .map(d => readThreshold(d, context))
    .filter((d): d is CFDataBarThreshold => d != null);
}
