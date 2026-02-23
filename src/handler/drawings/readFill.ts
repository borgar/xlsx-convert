import type { Element } from '@borgar/simple-xml';
import type { NoFill, PatternFill, FillPatternStyle, SolidFill, GroupFill } from '@jsfkit/types';
import { attr } from '../../utils/attr.ts';
import { getFirstChild } from '../../utils/getFirstChild.ts';
import { readColor } from '../../utils/readColor.ts';
import { readFillGradient } from './readFillGradient.ts';
import { readFillBlip } from './readFillBlip.ts';
import type { ConversionContext } from '../../ConversionContext.ts';

export function readFill (elm: Element | null | undefined, context: ConversionContext) {
  const tagName = elm?.tagName;

  // Picture Fill – §5.1.10.14
  if (tagName === 'blipFill') {
    // recurse/reuse the reader from readGraphicContent?
    return readFillBlip(elm, context);
  }

  // Gradient Fill – §5.1.10.33
  else if (tagName === 'gradFill') {
    return readFillGradient(elm, context);
  }

  // No Fill – §5.1.10.44
  else if (tagName === 'noFill') {
    return { type: 'none' } as NoFill;
  }

  // Group Fill – §5.1.10.35
  else if (tagName === 'grpFill') {
    return { type: 'group' } as GroupFill;
  }

  // Pattern Fill – §5.1.10.47
  else if (tagName === 'pattFill') {
    const fill = {
      type: 'pattern',
      style: attr(elm, 'prst') as FillPatternStyle | undefined,
    } as PatternFill;
    for (const ch of elm.children) {
      if (ch.tagName === 'fgClr') {
        fill.fg = readColor(getFirstChild(ch), context.theme).getJSF();
      }
      if (ch.tagName === 'bgClr') {
        fill.bg = readColor(getFirstChild(ch), context.theme).getJSF();
      }
    }
    return fill;
  }

  // Solid Fill – §5.1.10.54
  else if (tagName === 'solidFill') {
    return {
      type: 'solid',
      bg: readColor(elm.children[0], context.theme).getJSF(),
    } as SolidFill;
  }

  return undefined;
}
