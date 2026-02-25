import type { Element } from '@borgar/simple-xml';
import type { BlipFill, FlipAxis, RectAlignment } from '@jsfkit/types';
import type { ConversionContext } from '../../ConversionContext.ts';
import { attr, boolAttr, dmlPercentAttr, numAttr } from '../../utils/attr.ts';

export function readRelRect (elm: Element) {
  if (elm) {
    const l = dmlPercentAttr(elm, 'l');
    const t = dmlPercentAttr(elm, 't');
    const r = dmlPercentAttr(elm, 'r');
    const b = dmlPercentAttr(elm, 'b');
    if (l != null || t != null || r != null || b != null) {
      return {
        t: (t ?? 0),
        l: (l ?? 0),
        b: (b ?? 100),
        r: (r ?? 100),
      };
    }
  }
}
