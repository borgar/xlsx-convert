export function rle (list, defaultValue) {
  let lastItem = [];
  let current;
  return list
    .sort((a, b) => a[0] - b[0])
    .reduce((newList, item) => {
      const nextInSeq = lastItem[0] + 1 === item[0];
      const sameSize = lastItem[1] === item[1];
      if (nextInSeq && sameSize) {
        current.end = item[0];
      }
      else {
        current = {
          begin: item[0],
          end: item[0],
          size: item[1]
        };
        newList.push(current);
      }
      lastItem = item;
      return newList;
    }, [])
    .filter(d => d.size !== defaultValue);
}
