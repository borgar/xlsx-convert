import type { Element } from '@borgar/simple-xml';
import { numAttr } from '../../utils/attr.ts';
import type { Point } from '@jsfkit/types';

export function readPoint (elm: Element | null, nullIfZero = false): Point | undefined {
  if (elm) {
    const r = {
      x: numAttr(elm, 'x', 0),
      y: numAttr(elm, 'y', 0),
    };
    if (nullIfZero && !r.x && !r.y) {
      return undefined;
    }
    return r;
  }
  return undefined;
}
