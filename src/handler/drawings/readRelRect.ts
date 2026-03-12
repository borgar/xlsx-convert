import type { Element } from '@borgar/simple-xml';
import { dmlPercentAttr } from '../../utils/attr.ts';

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
