import type { Element } from '@borgar/simple-xml';
import type { CFIcon, CFIconSet, CFIconSetName, CFIconThreshold } from '@jsfkit/types';

import type { ConversionContext } from '../../ConversionContext.ts';
import { addProp } from '../../utils/addProp.ts';
import { attr, boolAttr, numAttr } from '../../utils/attr.ts';
import { isValueThreshold } from './isValueThreshold.ts';
import { readThreshold } from './readThreshold.ts';

/**
 * Reads an `<iconSet>` element.
 *
 * Returns null if the element holds no usable thresholds.
 */
export function readIconSet (node: Element, context: ConversionContext): CFIconSet | null {
  const thresholds: CFIconThreshold[] = [];
  const customIcons: CFIcon[] = [];
  for (const child of node.children) {
    if (child.tagName === 'cfvo') {
      const t = readThreshold(child, context);
      if (t && isValueThreshold(t)) {
        const threshold: CFIconThreshold = t;
        addProp(threshold, 'inclusive', boolAttr(child, 'gte'), true);
        thresholds.push(threshold);
      }
    }
    else if (child.tagName === 'cfIcon') {
      const setName = attr(child, 'iconSet') as CFIcon['setName'];
      const index = numAttr(child, 'iconId');
      if (setName && index != null) {
        customIcons.push({ setName, index });
      }
    }
  }
  if (!thresholds.length) {
    return null;
  }
  // Custom icons replace the named set, but only if there is one icon per threshold.
  const set = customIcons.length && customIcons.length === thresholds.length
    ? customIcons
    : attr(node, 'iconSet', '3TrafficLights1') as CFIconSetName;
  const iconSet: CFIconSet = { set, thresholds };
  addProp(iconSet, 'showValue', boolAttr(node, 'showValue'), true);
  addProp(iconSet, 'reverse', boolAttr(node, 'reverse'), false);
  return iconSet;
}
