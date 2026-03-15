import type { Element } from '@borgar/simple-xml';
import type { PivotCacheSharedItem } from '@jsfkit/types';
import { attr } from './attr.ts';

/** Parse a single `<s>`, `<n>`, `<b>`, `<d>`, `<e>`, or `<m>` element into a shared item. */
export function parseCacheSharedItem (el: Element): PivotCacheSharedItem | undefined {
  const u = attr(el, 'u') === '1' ? true : undefined;
  switch (el.tagName) {
    case 's':
      return u ? { t: 's', v: attr(el, 'v') ?? '', u } : { t: 's', v: attr(el, 'v') ?? '' };
    case 'n':
      return u ? { t: 'n', v: +(attr(el, 'v') ?? 0), u } : { t: 'n', v: +(attr(el, 'v') ?? 0) };
    case 'b':
      return u ? { t: 'b', v: !!+(attr(el, 'v') ?? 0), u } : { t: 'b', v: !!+(attr(el, 'v') ?? 0) };
    case 'd':
      return u ? { t: 'd', v: attr(el, 'v') ?? '', u } : { t: 'd', v: attr(el, 'v') ?? '' };
    case 'e':
      return u ? { t: 'e', v: attr(el, 'v') ?? '', u } : { t: 'e', v: attr(el, 'v') ?? '' };
    case 'm':
      return { t: 'z' };
  }
}
