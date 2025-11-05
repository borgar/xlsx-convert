import type { Element } from '@borgar/simple-xml';
import { numAttr } from '../../utils/attr.ts';
import { emu2px } from './emu2px.ts';
import type { Position } from './types.ts';

export function readPosition (elm: Element | null, nullIfZero = false): Position | undefined {
  if (elm) {
    const r = {
      x: emu2px(numAttr(elm, 'x', 0)),
      y: emu2px(numAttr(elm, 'y', 0)),
    };
    if (nullIfZero && !r.x && !r.y) {
      return undefined;
    }
    return r;
  }
  return undefined;
}
