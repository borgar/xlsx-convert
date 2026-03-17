import type { Element } from '@borgar/simple-xml';
import type { PivotCacheSharedItem } from '@jsfkit/types';
import { attr, boolAttr, numAttr } from '../../utils/attr.ts';

/** Parse a single `<s>`, `<n>`, `<b>`, `<d>`, `<e>`, or `<m>` element into a shared item. */
export function parseCacheSharedItem (elm: Element): PivotCacheSharedItem | undefined {
  const tag = elm.tagName;
  if (tag === 'm') {
    return { t: 'z' };
  }
  let result: PivotCacheSharedItem | undefined;
  if (tag === 's') {
    result = { t: 's', v: attr(elm, 'v') ?? '' };
  }
  else if (tag === 'n') {
    result = { t: 'n', v: numAttr(elm, 'v', 0) };
  }
  else if (tag === 'b') {
    result = { t: 'b', v: boolAttr(elm, 'v', false) };
  }
  else if (tag === 'd') {
    result = { t: 'd', v: attr(elm, 'v') ?? '' };
  }
  else if (tag === 'e') {
    result = { t: 'e', v: attr(elm, 'v') ?? '' };
  }
  if (result && boolAttr(elm, 'u') === true) {
    result.u = true;
  }
  return result;
}
