import type { JSFGridSize } from '../jsf-types.ts';

type IndexHeightPair = [ number, number ];

export function rle (list: IndexHeightPair[], defaultValue: number): JSFGridSize[] {
  let lastItem = [];
  let current: JSFGridSize;
  return list
    .sort((a, b) => a[0] - b[0])
    .reduce((newList: JSFGridSize[], item: IndexHeightPair) => {
      const nextInSeq = lastItem[0] + 1 === item[0];
      const sameSize = lastItem[1] === item[1];
      if (nextInSeq && sameSize) {
        current.end = item[0];
      }
      else {
        current = {
          start: item[0],
          end: item[0],
          size: item[1],
        };
        newList.push(current);
      }
      lastItem = item;
      return newList;
    }, [])
    .filter(d => d.size !== defaultValue);
}
