import type { Element } from '@borgar/simple-xml';
import type { BlipFill, FlipAxis, RectAlignment } from '@jsfkit/types';
import type { ConversionContext } from '../../ConversionContext.ts';
import { attr, boolAttr, dmlPercentAttr, numAttr } from '../../utils/attr.ts';

function readRelRect (elm: Element) {
  if (elm) {
    const l = dmlPercentAttr(elm, 'l');
    const t = dmlPercentAttr(elm, 't');
    const r = dmlPercentAttr(elm, 'r');
    const b = dmlPercentAttr(elm, 'b');
    if (l != null && t != null && r != null && b != null) {
      return {
        t: (t ?? 0),
        l: (l ?? 0),
        b: (b ?? 100),
        r: (r ?? 100),
      };
    }
  }
}

export function readFillBlip (elm: Element | undefined | null, context: ConversionContext) {
  if (elm?.tagName === 'blipFill') {
    const out: BlipFill = {
      type: 'blip',
      mediaId: '',
    };

    const blip = elm.querySelector('blip');
    const rId = blip.getAttribute('r:embed'); // "rId1"
    if (!rId) { return; }
    const rel = context.drawingRels.find(rel => rel.id === rId);

    if (rel?.type !== 'image') { return; }
    out.mediaId = rel.target;
    context.images.push({ rel, type: 'picture' });

    // Specifies the DPI (dots per inch) used to calculate the size of the blip.
    const dpi = numAttr(elm, 'dpi', 0);
    if (dpi) { out.dpi = dpi; }

    // Specifies that the fill should rotate with the shape.
    const rotWithShape = boolAttr(elm, 'rotWithShape', false);
    if (rotWithShape) { out.rotWithShape = rotWithShape; }

    const alphaModFix = blip.querySelector('> alphaModFix');
    if (alphaModFix) { out.alpha = dmlPercentAttr(alphaModFix, 'amt', 100); }

    const stretchRect = readRelRect(elm.querySelector('> stretch > fillRect'));
    if (stretchRect) { out.stretchRect = stretchRect; }

    const srcRect = readRelRect(elm.querySelector('> srcRect'));
    if (srcRect) { out.srcRect = srcRect; }

    const tile = elm.querySelector('tile');
    if (tile) {
      const tx = numAttr(tile, 'tx'); // additional horizontal offset after alignment (EMU)
      const ty = numAttr(tile, 'ty'); // additional vertical offset after alignment (EMU)
      const sx = dmlPercentAttr(tile, 'sx'); // amount to vertically scale the srcRect
      const sy = dmlPercentAttr(tile, 'sy'); // amount to horizontally scale the srcRect
      const flip = attr(tile, 'flip') as FlipAxis; // direction(s) in which to flip the source image while tiling
      const align = attr(tile, 'algn') as RectAlignment; // where to align the first tile with respect to the shape (after sx/sy, but before tx/ty)
      out.tile = { tx, ty, sx, sy, flip, align };
    }

    return out;
  }
}
