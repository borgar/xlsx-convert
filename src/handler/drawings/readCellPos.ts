import { Element } from '@borgar/simple-xml';
import type { CellOffset } from '@jsfkit/types';

export function readCellPos (elm: Element | null): CellOffset {
  const out = {
    row: 0,
    rowOff: 0,
    col: 0,
    colOff: 0,
  };
  if (elm) {
    for (const node of elm.childNodes) {
      const tagName = (node instanceof Element) ? node.tagName : '';
      const val = +(node.textContent || '0');
      if (tagName in out && isFinite(val)) {
        // @ts-expect-error we already know tagName exists on out because of the above check
        out[tagName] = val;
      }
    }
  }
  return out;
}
