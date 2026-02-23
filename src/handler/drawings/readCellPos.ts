import { Element } from '@borgar/simple-xml';
import type { CellOffset } from '@jsfkit/types';

export function readCellPos (elm: Element | null): CellOffset {
  const out = {
    row: 0,
    rowOff: 0,
    col: 0,
    colOff: 0,
  };
  for (const node of elm.childNodes) {
    const tagName = (node instanceof Element) ? node.tagName : '';
    if (tagName in out) {
      out[tagName] = +(node.textContent || '0');
    }
  }
  return out;
}
