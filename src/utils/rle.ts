import type { GridSize } from '@jsfkit/types';

export function rle (list: GridSize[], defaultValue: number): GridSize[] {
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
          size: item.size,
        };
        if (item.s != null) {
          current.s = item.s;
        }
        newList.push(current);
      }
      lastItem = item;
      return newList;
    }, [])
    .filter(d => {
      const defaultSize = d.size !== defaultValue;
      const hasStyle = d.s != null;
      return defaultSize || hasStyle;
    });
}
