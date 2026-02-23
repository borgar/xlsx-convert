import type { Document, Element } from '@borgar/simple-xml';
import type { Drawing } from '@jsfkit/types';
import { readAnchor } from './drawings/readAnchor.ts';
import { readGraphicContent } from './drawings/readGraphicContent.ts';
import type { ConversionContext } from '../ConversionContext.ts';

export function handlerDrawing (dom: Document, context: ConversionContext): Drawing[] {
  const drawings: Drawing[] = [];

  // loop across anchors
  dom.root.children.forEach((anchorElm: Element) => {
    let drawing: Drawing | null = null;

    const tagName = anchorElm.tagName;
    if (tagName === 'absoluteAnchor' || tagName === 'oneCellAnchor' || tagName === 'twoCellAnchor') {
      const anch = readAnchor(anchorElm);
      if (anch) {
        drawing = {
          anchor: anch,
          content: readGraphicContent(anchorElm, context),
        };
      }
    }

    if (drawing?.content?.length) {
      drawings.push(drawing);
    }
  });

  return drawings;
}
