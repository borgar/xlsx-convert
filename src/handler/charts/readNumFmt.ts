import type { Element } from '@borgar/simple-xml';
import { attr, boolAttr } from '../../utils/attr.ts';
import type { NumFmt } from './types/NumFmt.ts';

export function readNumFmt (element: Element): NumFmt | undefined {
  if (element?.tagName === 'numFmt') {
    const formatCode = attr(element, 'formatCode');
    const sourceLinked = boolAttr(element, 'formatCode');
    if (formatCode !== 'General' || sourceLinked) {
      return { formatCode, sourceLinked };
    }
  }
}
