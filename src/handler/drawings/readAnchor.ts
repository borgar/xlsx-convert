import type { Element } from '@borgar/simple-xml';
import type { GraphicAnchor } from '@jsfkit/types';
import { readPoint } from './readPoint.ts';
import { readExtent } from './readExtent.ts';
import { readCellPos } from './readCellPos.ts';

export function readAnchor (element: Element | null): GraphicAnchor | undefined {
  if (element?.tagName === 'absoluteAnchor') {
    return {
      type: 'absolute',
      pos: readPoint(element.querySelector('pos')) ?? { x: 0, y: 0 },
      ext: readExtent(element.querySelector('ext')) ?? { cx: 0, cy: 0 },
    };
  }
  else if (element?.tagName === 'oneCellAnchor') {
    return {
      type: 'oneCell',
      from: readCellPos(element.querySelector('from')),
      ext: readExtent(element.querySelector('ext')) ?? { cx: 0, cy: 0 },
    };
  }
  else if (element?.tagName === 'twoCellAnchor') {
    return {
      type: 'twoCell',
      from: readCellPos(element.querySelector('from')),
      to: readCellPos(element.querySelector('to')),
    };
  }
}
