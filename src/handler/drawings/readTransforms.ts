import type { Element } from '@borgar/simple-xml';
import { boolAttr, numAttr } from '../../utils/attr.ts';
import { readPoint } from './readPoint.ts';
import type { Xfrm, XfrmGroup } from '@jsfkit/types';
import { readExtent } from './readExtent.ts';

export function readTransforms (elm: Element | null, group: true): XfrmGroup | undefined;
export function readTransforms (elm: Element | null, group?: false): Xfrm | undefined;
export function readTransforms (elm: Element | null, group = false): Xfrm | XfrmGroup | undefined {
  if (elm) {
    // NB: the more liberal type is being set here to avoid type complexity
    const out: XfrmGroup = {};

    // flipping
    const flipH = boolAttr(elm, 'flipH', false);
    const flipV = boolAttr(elm, 'flipV', false);
    if (flipH && flipV) { out.flip = 'xy'; }
    else if (flipH) { out.flip = 'x'; }
    else if (flipV) { out.flip = 'y'; }

    // rotation
    const rot = numAttr(elm, 'rot', 0);
    if (rot) { out.rot = rot; }

    // offsets
    for (const ch of elm.children) {
      if (ch.tagName === 'off') {
        const off = readPoint(ch, true);
        if (off) { out.off = off; }
      }
      else if (ch.tagName === 'ext') {
        const ext = readExtent(ch);
        if (ext) { out.ext = ext; }
      }

      if (group) {
        if (ch.tagName === 'chOff') {
          const off = readPoint(ch, true);
          if (off) { out.chOff = off; }
        }
        else if (ch.tagName === 'chExt') {
          const ext = readExtent(ch);
          if (ext) { out.chExt = ext; }
        }
      }
    }

    if (out.flip || out.rot || out.off || out.ext) {
      return out;
    }
  }
}
