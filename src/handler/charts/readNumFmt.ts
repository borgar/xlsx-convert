import type { Element } from '@borgar/simple-xml';
import { attr, boolAttr } from '../../utils/attr.ts';
import type { NumFmt } from './types/NumFmt.ts';

export function readNumFmt (element: Element): NumFmt | undefined {
  if (element?.tagName === 'numFmt') {
    const formatCode = attr(element, 'formatCode');
    const sourceLinked = boolAttr(element, 'sourceLinked');
    // Keep General too: a PRESENT numFmt with formatCode="General" sourceLinked="1" is Excel's
    // "linked to source" marker (e.g. a value axis inheriting the source cells' format), which
    // is distinct from the element being absent entirely (plain General, no inheritance).
    if (formatCode) {
      if (sourceLinked === false) {
        return { formatCode, sourceLinked };
      }
      return { formatCode };
    }
  }
}
