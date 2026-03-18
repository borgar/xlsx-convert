import type { Element } from '@borgar/simple-xml';
import type { PivotRowColItem } from '@jsfkit/types';
import { attr, numAttr } from '../../utils/attr.ts';
import { parseEnum } from '../../utils/parseEnum.ts';
import { ITEM_TYPES } from './constants.ts';

export function parseRowColItems (root: Element, selector: string): PivotRowColItem[] {
  const items: PivotRowColItem[] = [];
  for (const elm of root.querySelectorAll(selector)) {
    const itemType = parseEnum(attr(elm, 't'), ITEM_TYPES);
    const repeatedItemCount = numAttr(elm, 'r', 0);
    const itemIndices: number[] = [];
    for (const x of elm.getElementsByTagName('x')) {
      itemIndices.push(numAttr(x, 'v', 0));
    }
    const item: PivotRowColItem = {};
    if (itemIndices.length > 0) {
      item.itemIndices = itemIndices;
    }
    if (itemType != null) {
      item.itemType = itemType;
    }
    if (repeatedItemCount !== 0) {
      item.repeatedItemCount = repeatedItemCount;
    }
    const dataFieldIndex = numAttr(elm, 'i', 0);
    if (dataFieldIndex !== 0) {
      item.dataFieldIndex = dataFieldIndex;
    }
    items.push(item);
  }
  return items;
}
