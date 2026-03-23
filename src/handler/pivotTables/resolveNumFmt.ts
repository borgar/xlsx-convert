import type { Element } from '@borgar/simple-xml';
import { numAttr } from '../../utils/attr.ts';
import type { NumFmtLookup } from './NumFmtLookup.ts';

/**
 * Resolve an element's `numFmtId` attribute to a format code string via the
 * style table, returning `undefined` when absent, unresolvable, or "General".
 */
export function resolveNumFmt (el: Element, numFmts?: NumFmtLookup): string | undefined {
  const id = numAttr(el, 'numFmtId');
  if (id != null && numFmts) {
    const fmt = numFmts[id];
    if (typeof fmt === 'string' && fmt.toLowerCase() !== 'general') {
      return fmt;
    }
  }
}
