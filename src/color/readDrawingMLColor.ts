import type { Element } from '@borgar/simple-xml';
import type { Color as JSFColor, ColorTransform } from '@jsfkit/types';
import { attr, numAttr } from '../utils/attr.ts';

/**
 * Reads colour transforms from a DrawingML colour element's children and returns them as a
 * ColorTransform array.
 */
function readTransforms (elm: Element): ColorTransform[] {
  const transforms: ColorTransform[] = [];
  elm.children.forEach(opElm => {
    const tagName = opElm?.tagName;
    // Booleans --- whole-colour operations.
    if (tagName === 'comp' || tagName === 'gamma' || tagName === 'invGamma' ||
        tagName === 'gray' || tagName === 'inv') {
      transforms.push({ type: tagName });
    }
    // Percentage-based operations (OOXML stores these as 1/1000th of a percent)
    else if (
      tagName === 'alpha' || tagName === 'alphaMod' || tagName === 'alphaOff' ||
      tagName === 'blue' || tagName === 'blueMod' || tagName === 'blueOff' ||
      tagName === 'green' || tagName === 'greenMod' || tagName === 'greenOff' ||
      tagName === 'red' || tagName === 'redMod' || tagName === 'redOff' ||
      tagName === 'hueMod' ||
      tagName === 'sat' || tagName === 'satMod' || tagName === 'satOff' ||
      tagName === 'lum' || tagName === 'lumMod' || tagName === 'lumOff' ||
      tagName === 'shade' || tagName === 'tint') {
      transforms.push({ type: tagName, value: numAttr(opElm, 'val', 0) / 1000 } as ColorTransform);
    }
    // Degree-based operations (OOXML stores as 1/60,000th of a degree)
    else if (tagName === 'hue' || tagName === 'hueOff') {
      transforms.push({ type: tagName, value: numAttr(opElm, 'val', 0) / 60000 } as ColorTransform);
    }
  });
  return transforms;
}

/**
 * Converts a DrawingML colour element to a JSF Color.
 */
export function readDrawingMLColor (elm: Element): JSFColor {
  const tagName = elm?.tagName;
  let color: JSFColor | null = null;

  if (tagName === 'sysClr') {
    const val = attr(elm, 'val');
    if (val) {
      color = { type: 'system', value: val } as JSFColor;
    }
  }
  else if (tagName === 'srgbClr') {
    color = { type: 'srgb', value: attr(elm, 'val', '000000').toUpperCase() };
  }
  else if (tagName === 'scrgbClr') {
    // OOXML scRGB values are stored as 1/1000th of a percent
    color = {
      type: 'scrgb',
      red: numAttr(elm, 'r', 0) / 1000,
      green: numAttr(elm, 'g', 0) / 1000,
      blue: numAttr(elm, 'b', 0) / 1000,
    };
  }
  else if (tagName === 'hslClr') {
    // OOXML stores hue as 1/60,000th of a degree, saturation and lightness as 1/1000th of a percent
    color = {
      type: 'hsl',
      hue: numAttr(elm, 'hue', 0) / 60000,
      saturation: numAttr(elm, 'sat', 0) / 1000,
      lightness: numAttr(elm, 'lum', 0) / 1000,
    };
  }
  else if (tagName === 'prstClr') {
    const val = attr(elm, 'val');
    if (val) {
      color = { type: 'preset', value: val } as JSFColor;
    }
  }
  else if (tagName === 'schemeClr') {
    const val = attr(elm, 'val');
    if (val) {
      color = { type: 'theme', value: val } as JSFColor;
    }
  }

  if (color) {
    const transforms = readTransforms(elm);
    if (transforms.length) {
      color.transforms = transforms;
    }
  }

  return color;
}
