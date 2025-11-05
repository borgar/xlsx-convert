import type { Element } from '@borgar/simple-xml';
import type { Transform2D } from './types.ts';
import { boolAttr, numAttr } from '../../utils/attr.ts';
import { readPosition } from './readPosition.ts';
import { getFirstChild } from '../../utils/getFirstChild.ts';

export function readTransforms (elm: Element | null): Transform2D | undefined {
  if (elm) {
    const out: Transform2D = {};
    if (boolAttr(elm, 'flipH')) {
      out.flipH = true;
    }
    if (boolAttr(elm, 'flipV')) {
      out.flipV = true;
    }
    const rot = numAttr(elm, 'rot', 0);
    if (rot) {
      out.rotate = rot;
    }
    const off = readPosition(getFirstChild(elm, 'off'), true);
    if (off) {
      out.offset = off;
    }
    const extent = readPosition(getFirstChild(elm, 'ext'), true);
    if (extent) {
      out.offset = extent;
    }
    if (out.flipH || out.flipV || out.rotate || out.offset || out.extent) {
      return out;
    }
  }
}
