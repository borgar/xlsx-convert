import type { Element } from '@borgar/simple-xml';
import type { BlipFill, FlipAxis, RectAlignment, Tile } from '@jsfkit/types';
import type { ConversionContext } from '../../ConversionContext.ts';
import { attr, boolAttr, dmlPercentAttr, numAttr } from '../../utils/attr.ts';
import { readRelRect } from './readRelRect.ts';
import { addProp } from '../../utils/addProp.ts';

export function readFillBlip (elm: Element | undefined | null, context: ConversionContext) {
  if (elm?.tagName === 'blipFill') {
    const out: BlipFill = {
      type: 'blip',
      mediaId: '',
    };

    const blip = elm.querySelector('blip');
    const rId = blip?.getAttribute('r:embed');
    if (!rId) { return; }
    const rel = context.drawingRels.find(d => d.id === rId);

    if (rel?.type !== 'image') { return; }
    out.mediaId = rel.target;
    context.images.push({ rel, type: 'picture' });

    // Specifies the DPI (dots per inch) used to calculate the size of the blip.
    const dpi = numAttr(elm, 'dpi', 0);
    if (dpi) { out.dpi = dpi; }

    // Specifies that the fill should rotate with the shape.
    const rotWithShape = boolAttr(elm, 'rotWithShape', false);
    if (rotWithShape) { out.rotWithShape = rotWithShape; }

    const alphaModFix = blip?.querySelector('> alphaModFix');
    if (alphaModFix) { out.alpha = dmlPercentAttr(alphaModFix, 'amt', 100); }

    const stretchRect = readRelRect(elm.querySelector('> stretch > fillRect'));
    if (stretchRect) { out.stretchRect = stretchRect; }

    const srcRect = readRelRect(elm.querySelector('> srcRect'));
    if (srcRect) { out.srcRect = srcRect; }

    const tileElm = elm.querySelector('tile');
    if (tileElm) {
      const tile: Tile = {};
      // additional horizontal offset after alignment (EMU)
      addProp(tile, 'tx', numAttr(tileElm, 'tx'));
      // additional vertical offset after alignment (EMU)
      addProp(tile, 'ty', numAttr(tileElm, 'ty'));
      // amount to vertically scale the srcRect
      addProp(tile, 'sx', dmlPercentAttr(tileElm, 'sx'));
      // amount to horizontally scale the srcRect
      addProp(tile, 'sy', dmlPercentAttr(tileElm, 'sy'));
      // direction(s) in which to flip the source image while tiling
      addProp(tile, 'flip', attr(tileElm, 'flip') as FlipAxis | undefined);
      // where to align the first tile with respect to the shape (after sx/sy, but before tx/ty)
      addProp(tile, 'align', attr(tileElm, 'algn') as RectAlignment | undefined);
      out.tile = tile;
    }

    return out;
  }
}
