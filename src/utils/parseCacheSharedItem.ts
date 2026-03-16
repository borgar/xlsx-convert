import type { Element } from '@borgar/simple-xml';
import type { PivotCacheSharedItem } from '@jsfkit/types';
import { attr } from './attr.ts';

/** Parse a single `<s>`, `<n>`, `<b>`, `<d>`, `<e>`, or `<m>` element into a shared item. */
export function parseCacheSharedItem (elm: Element): PivotCacheSharedItem | undefined {
  const u = attr(elm, 'u') === '1' ? true : undefined;
  let result: PivotCacheSharedItem | undefined;
  switch (elm.tagName) {
    case 's':
      result = { t: 's', v: attr(elm, 'v') ?? '' };
      break;
    case 'n':
      result = { t: 'n', v: +(attr(elm, 'v') ?? 0) };
      break;
    case 'b':
      result = { t: 'b', v: !!+(attr(elm, 'v') ?? 0) };
      break;
    case 'd':
      result = { t: 'd', v: attr(elm, 'v') ?? '' };
      break;
    case 'e':
      result = { t: 'e', v: attr(elm, 'v') ?? '' };
      break;
    case 'm':
      return { t: 'z' };
  }
  if (result && u) {
    result.u = true;
  }
  return result;
}
