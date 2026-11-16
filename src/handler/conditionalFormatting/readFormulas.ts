import type { Element } from '@borgar/simple-xml';

import type { ConversionContext } from '../../ConversionContext.ts';
import { normalizeFormula } from '../../utils/normalizeFormula.ts';

/**
 * Reads the formulas held directly by a rule. The original OOXML spec uses `<formula>` elements
 * while the x14 extension uses `<xm:f>`.
 */
export function readFormulas (node: Element, context: ConversionContext): string[] {
  return node.children
    .filter(d => d.tagName === 'formula' || d.tagName === 'f')
    .map(d => normalizeFormula(d.textContent.trim(), context));
}
