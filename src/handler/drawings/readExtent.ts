import { emu2px } from './emu2px.ts';
import { numAttr } from '../../utils/attr.ts';
import type { Extent } from './types.ts';
import type { Element } from '@borgar/simple-xml';

export function readExtent (elm: Element | null, nullIfZero = false): Extent | undefined {
  if (elm) {
    const r = {
      x: emu2px(numAttr(elm, 'cx', 0)),
      y: emu2px(numAttr(elm, 'cy', 0)),
    };
    if (nullIfZero && !r.x && !r.y) {
      return undefined;
    }
    return r;
  }
  return undefined;
}
