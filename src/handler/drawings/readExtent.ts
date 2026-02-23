import type { Extent } from '@jsfkit/types';
import type { Element } from '@borgar/simple-xml';
import { numAttr } from '../../utils/attr.ts';

export function readExtent (elm: Element | null, nullIfZero = false): Extent | undefined {
  if (elm) {
    const r = {
      cx: numAttr(elm, 'cx', 0),
      cy: numAttr(elm, 'cy', 0),
    };
    if (nullIfZero && !r.cx && !r.cy) {
      return undefined;
    }
    return r;
  }
  return undefined;
}
