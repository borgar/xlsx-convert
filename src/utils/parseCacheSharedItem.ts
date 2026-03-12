import type { Element } from '@borgar/simple-xml';
import type { PivotCacheSharedItem } from '@jsfkit/types';
import { attr } from './attr.ts';

/** Parse a single `<s>`, `<n>`, `<b>`, `<d>`, `<e>`, or `<m>` element into a shared item. */
export function parseCacheSharedItem (el: Element): PivotCacheSharedItem | undefined {
  switch (el.tagName) {
    case 's':
      return { t: 's', v: attr(el, 'v') ?? '' };
    case 'n':
      return { t: 'n', v: +(attr(el, 'v') ?? 0) };
    case 'b':
      return { t: 'b', v: !!+(attr(el, 'v') ?? 0) };
    case 'd':
      return { t: 'd', v: attr(el, 'v') ?? '' };
    case 'e':
      return { t: 'e', v: attr(el, 'v') ?? '' };
    case 'm':
      return { t: 'z' };
  }
}
