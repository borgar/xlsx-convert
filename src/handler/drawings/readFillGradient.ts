import type { Element } from '@borgar/simple-xml';
import type { FlipAxis, GradientColorStop, GradientLinearFill, GradientPathFill, PathFillType, RelativeRect } from '@jsfkit/types';
import { getFirstChild } from '../../utils/getFirstChild.ts';
import { attr, boolAttr, dmlPercentAttr, numAttr } from '../../utils/attr.ts';
import { readColor } from '../../utils/readColor.ts';
import type { ConversionContext } from '../../ConversionContext.ts';

export function readFillGradient (elm: Element, context: ConversionContext) {
  let colorStops: GradientColorStop[] = [];
  let fillType: 'linearGradient' | 'pathGradient' = 'linearGradient';
  let fillAngle = 0;
  let fillScaled = false;
  let fillPath: PathFillType;
  let fillToRect: RelativeRect;

  for (const child of elm.children) {
    if (child.tagName === 'gsLst') {
      colorStops = [];
      child.querySelectorAll('>gs').forEach(gs => {
        const offset = dmlPercentAttr(gs, 'pos');
        const color = readColor(getFirstChild(gs), context.theme).getJSF();
        colorStops.push({ offset, color });
      });
    }
    else if (child.tagName === 'lin') {
      fillType = 'linearGradient';
      fillAngle = numAttr(child, 'ang');
      fillScaled = boolAttr(child, 'scaled');
    }
    else if (child.tagName === 'path') {
      fillType = 'pathGradient';
      fillPath = attr(child, 'path') as PathFillType;
    }
    else if (child.tagName === 'tileRect') {
      const fr = getFirstChild(child, 'fillToRect');
      if (fr) {
        fillToRect = {
          t: dmlPercentAttr(fr, 't'),
          b: dmlPercentAttr(fr, 'b'),
          l: dmlPercentAttr(fr, 'l'),
          r: dmlPercentAttr(fr, 'r'),
        };
      }
    }
  }

  let fill: GradientPathFill | GradientLinearFill;
  if (fillType === 'linearGradient') {
    fill = {
      type: 'linearGradient',
      colorStops,
      angle: fillAngle,
      scaled: fillScaled,
    };
  }
  else if (fillType === 'pathGradient') {
    fill = {
      type: 'pathGradient',
      colorStops,
      fillToRect,
      path: fillPath,
    };
  }
  else {
    return;
  }

  // Direction(s) in which to flip the gradient while tiling
  const flip = attr(elm, 'flip') as FlipAxis | undefined;
  if (flip) { fill.flip = flip; }

  // If a fill will rotate along with a shape when the shape is rotated
  const rotWithShape = boolAttr(elm, 'rotWithShape', false);
  if (rotWithShape) { fill.rotWithShape = rotWithShape; }

  return fill;
}
