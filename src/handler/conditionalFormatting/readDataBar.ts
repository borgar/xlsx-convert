import type { Element } from '@borgar/simple-xml';
import type { CFDataBar } from '@jsfkit/types';

import { readColor } from '../../color/readColor.ts';
import type { ConversionContext } from '../../ConversionContext.ts';
import { addProp } from '../../utils/addProp.ts';
import { attr, boolAttr, numAttr } from '../../utils/attr.ts';
import { getFirstChild } from '../../utils/getFirstChild.ts';
import { readThresholds } from './readThresholds.ts';

/**
 * Reads a `<dataBar>` element. Properties at their JSF default are omitted.
 */
export function readDataBar (node: Element, context: ConversionContext): Partial<CFDataBar> {
  const bar: Partial<CFDataBar> = {};
  const thresholds = readThresholds(node, context);
  if (thresholds.length >= 2) {
    bar.min = thresholds[0];
    bar.max = thresholds[1];
  }
  addProp(bar, 'minLength', numAttr(node, 'minLength'), 10);
  addProp(bar, 'maxLength', numAttr(node, 'maxLength'), 90);
  addProp(bar, 'showValue', boolAttr(node, 'showValue'), true);
  addProp(bar, 'fillColor', readColor(getFirstChild(node, 'color'), context.theme));
  const border = boolAttr(node, 'border', false);
  if (border) {
    addProp(bar, 'borderColor', readColor(getFirstChild(node, 'borderColor'), context.theme));
  }
  if (!boolAttr(node, 'negativeBarColorSameAsPositive', false)) {
    addProp(
      bar,
      'negativeFillColor',
      readColor(getFirstChild(node, 'negativeFillColor'), context.theme),
    );
  }
  if (border && !boolAttr(node, 'negativeBarBorderColorSameAsPositive', true)) {
    addProp(
      bar,
      'negativeBorderColor',
      readColor(getFirstChild(node, 'negativeBorderColor'), context.theme),
    );
  }
  addProp(bar, 'axisColor', readColor(getFirstChild(node, 'axisColor'), context.theme));
  addProp(bar, 'gradient', boolAttr(node, 'gradient'), true);
  const direction = attr(node, 'direction');
  if (direction === 'leftToRight' || direction === 'rightToLeft') {
    bar.direction = direction;
  }
  const axisPosition = attr(node, 'axisPosition');
  if (axisPosition === 'middle' || axisPosition === 'none') {
    bar.axisPosition = axisPosition;
  }
  return bar;
}
