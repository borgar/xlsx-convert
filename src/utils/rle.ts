import type { GridSize } from '@jsfkit/types';

export function rle (list: GridSize[], defaultSize: number): GridSize[] {
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
      const hasSize = d.size != null && d.size !== defaultSize;
      const hasStyle = d.s != null;
      return hasSize || hasStyle;
    });
}
