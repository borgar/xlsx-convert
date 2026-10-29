import type { Element } from '@borgar/simple-xml';
import type { CFDataBarThreshold } from '@jsfkit/types';

import type { ConversionContext } from '../../ConversionContext.ts';
import { attr } from '../../utils/attr.ts';
import { getFirstChild } from '../../utils/getFirstChild.ts';
import { normalizeFormula } from '../../utils/normalizeFormula.ts';

/**
 * Reads a `<cfvo>` threshold. The original OOXML spec stores the value in a `val` attribute, but
 * the x14 extension holds it in an `<xm:f>` child.
 */
export function readThreshold (
  node: Element,
  context: ConversionContext,
): CFDataBarThreshold | null {
  const type = attr(node, 'type');
  if (type === 'min' || type === 'max' || type === 'autoMin' || type === 'autoMax') {
    return { type };
  }
  const raw = (attr(node, 'val') ?? getFirstChild(node, 'f')?.textContent ?? '').trim();
  const isNumber = raw !== '' && isFinite(+raw);
  if (type === 'num') {
    return { type: 'number', value: +raw };
  }
  if (type === 'percent' || type === 'percentile') {
    return { type, value: isNumber ? +raw : normalizeFormula(raw, context) };
  }
  if (type === 'formula') {
    return { type, value: normalizeFormula(raw, context) };
  }
  return null;
}
