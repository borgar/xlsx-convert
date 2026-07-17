import type { GridSize } from '@jsfkit/types';

/**
 * Run-length encode a list of grid sizes. When `defaultSize` is given, entries whose size equals
 * it (and that carry no style) are dropped as redundant. Omit it to keep every explicit size: an
 * explicit row height is a PINNED height even when it happens to equal the sheet default, and
 * Excel renders pinned and auto heights differently (auto rows derive from the font).
 */
export function rle (list: GridSize[], defaultSize?: number): GridSize[] {
  let lastItem: GridSize = {
    start: NaN,
    end: NaN,
    size: NaN,
    s: NaN,
  };
  let current: GridSize;
  return list
    .sort((a, b) => a.start - b.start)
    .reduce((newList: GridSize[], item: GridSize) => {
      const nextInSeq = lastItem.end + 1 === item.start;
      const sameSize = lastItem.size === item.size;
      const sameStyle = lastItem.s === item.s;
      if (nextInSeq && sameSize && sameStyle) {
        current.end = item.end;
      }
      else {
        current = {
          start: item.start,
          end: item.end,
        };
        if (item.size != null) {
          current.size = item.size;
        }
        if (item.s != null) {
          current.s = item.s;
        }
        newList.push(current);
      }
      lastItem = item;
      return newList;
    }, [])
    .filter(d => {
      const hasSize = d.size != null && (defaultSize == null || d.size !== defaultSize);
      const hasStyle = d.s != null;
      return hasSize || hasStyle;
    });
}
