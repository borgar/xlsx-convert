import type { Document, Element } from '@borgar/simple-xml';
import type { Drawing } from './drawings/types.ts';
import { readAnchor } from './drawings/readAnchor.ts';
import type { Rel } from './rels.ts';
import { readGraphicContent } from './drawings/readGraphicContent.ts';
import type { ConversionContext } from '../ConversionContext.ts';

export function handlerDrawing (dom: Document, context: ConversionContext, rels: Rel[]): Drawing[] {
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
          content: readGraphicContent(anchorElm, context, rels),
        };
      }
    }

    // console.dir(drawing, { depth: null });
    if (drawing?.content?.length) {
      drawings.push(drawing);
    }
  });

  return drawings;
}
