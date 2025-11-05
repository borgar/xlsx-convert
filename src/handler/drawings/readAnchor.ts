import type { Element } from '@borgar/simple-xml';
import type { GraphicAnchor } from './types.ts';
import { readPosition } from './readPosition.ts';
import { readExtent } from './readExtent.ts';
import { readCellPos } from './readCellPos.ts';

export function readAnchor (element: Element | null): GraphicAnchor | undefined {
  if (element?.tagName === 'absoluteAnchor') { // §5.6.2.1
    return {
      type: 'absolute',
      position: readPosition(element.querySelector('pos')),
      extent: readExtent(element.querySelector('ext')),
    };
  }
  else if (element?.tagName === 'oneCellAnchor') { // §5.6.2.23
    return {
      type: 'oneCell',
      from: readCellPos(element.querySelector('from')),
      extent: readExtent(element.querySelector('ext')),
    };
  }
  else if (element?.tagName === 'twoCellAnchor') { // §5.6.2.32
    return {
      type: 'twoCell',
      from: readCellPos(element.querySelector('from')),
      to: readCellPos(element.querySelector('to')),
    };
  }
}
