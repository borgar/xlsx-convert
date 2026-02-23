import type { Element } from '@borgar/simple-xml';
import type { GraphicAnchor } from '@jsfkit/types';
import { readPosition } from './readPosition.ts';
import { readExtent } from './readExtent.ts';
import { readCellPos } from './readCellPos.ts';

export function readAnchor (element: Element | null): GraphicAnchor | undefined {
  if (element?.tagName === 'absoluteAnchor') {
    return {
      type: 'absolute',
      pos: readPosition(element.querySelector('pos')),
      ext: readExtent(element.querySelector('ext')),
    };
  }
  else if (element?.tagName === 'oneCellAnchor') {
    return {
      type: 'oneCell',
      from: readCellPos(element.querySelector('from')),
      ext: readExtent(element.querySelector('ext')),
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
