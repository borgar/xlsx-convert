import type { Element } from '@borgar/simple-xml';
import type { Color as JSFColor, ColorTransform, Theme } from '@jsfkit/types';
import { attr, numAttr } from '../utils/attr.ts';
import { Color } from './Color.ts';
import { SYSTEM_COLORS, PRESET_COLORS, SCHEME_COLORS, INDEX_TO_SCHEME } from '../constants.ts';
import { readDrawingMLColor } from './readDrawingMLColor.ts';

/**
 * Reads a color element and returns a Color container. This should handle any of the
 * multiple color elements found within an XSLX workbook:
 *
 * - `<color>`
 * - `<fgColor>`
 * - `<bgColor>`
 * - `<schemeClr>`
 * - `<hslClr>`
 * - `<prstClr>`
 * - `<scrgbClr>`
 * - `<srgbClr>`
 * - `<sysClr>`
 */
export function readColor (elm: Element, theme: Theme): Color | undefined {
  if (!elm) { return undefined; }
  const tagName = elm.tagName;
  // §3.8.3 - bgColor
  // §3.8.18 - fgColor
  // §3.3.1.14 - color
  if (tagName === 'color' || tagName === 'fgColor' || tagName === 'bgColor') {
    // Element may have any of the following attributes:
    // - [auto]    - A boolean value indicating the color is automatic and system color dependent.
    // - [indexed] - References a color in indexedColors.
    // - [rgb]     - Standard Alpha Red Green Blue color value (ARGB).
    // - [theme]   - Index into the <clrScheme> collection, referencing a particular <sysClr> or
    //               <srgbClr> value expressed in the Theme part.
    // As well as:
    // - [tint]    - Specifies the tint value applied to the color (-1.0 .. 1.0)
    const auto = attr(elm, 'auto');
    if (auto === '1' || auto === 'true') {
      return new Color({ type: 'auto' }, theme);
    }

    let jsfColor: JSFColor | undefined;
    const argb = attr(elm, 'rgb', ''); // ARGB
    if (argb) {
      // Convert ARGB to 6-digit sRGB hex (dropping the alpha prefix if present)
      const hex = argb.length === 8 ? argb.slice(2) : argb;
      jsfColor = { type: 'srgb', value: hex.toUpperCase() };
    }
    else {
      const indexed = attr(elm, 'indexed', '');
      if (indexed) {
        jsfColor = { type: 'indexed', value: +indexed };
      }
      else {
        // theme: A zero-based index into the <clrScheme> collection (§20.1.6.2),
        //        referencing a particular <sysClr> or <srgbClr> value expressed
        //        in the Theme part.
        const themeIdx = attr(elm, 'theme');
        if (themeIdx && theme) {
          const key = INDEX_TO_SCHEME[+themeIdx];
          if (key) {
            jsfColor = { type: 'theme', value: key } as JSFColor;
          }
        }
      }
    }

    if (!jsfColor) {
      return undefined;
    }

    // Convert the XLSX tint attribute to a shade or tint colour transform. XLSX tint is the
    // proportion shifted towards white (positive) or black (negative), but the internal
    // ColorTransform value uses the DrawingML convention: the percentage of the original
    // colour to retain. So XLSX tint=0.4 ("add 40% white") becomes value=60 ("retain 60%").
    const tint = numAttr(elm, 'tint', 0);
    if (tint < 0) {
      jsfColor.transforms = [ { type: 'shade', value: (1 + tint) * 100 } as ColorTransform ];
    }
    else if (tint > 0) {
      jsfColor.transforms = [ { type: 'tint', value: (1 - tint) * 100 } as ColorTransform ];
    }

    return new Color(jsfColor, theme);
  }

  // DrawingML colour elements — validate, then delegate to readDrawingMLColor()

  // §5.1.2.2.29: Scheme Color - "specifies a color bound to a user's theme"
  else if (tagName === 'schemeClr') {
    const val = attr(elm, 'val');
    if (val in SCHEME_COLORS) {
      const jsfColor = readDrawingMLColor(elm);
      if (jsfColor) {
        return new Color(jsfColor, theme);
      }
    }
  }

  // §5.1.2.2.13: HSL Color Model - "a perceptual gamma of 2.2 is assumed"
  // §5.1.2.2.32: RGB Color Model - Hex Variant
  // §5.1.2.2.30: RGB Color Model - Percentage Variant
  else if (tagName === 'hslClr' || tagName === 'srgbClr' || tagName === 'scrgbClr') {
    const jsfColor = readDrawingMLColor(elm);
    if (jsfColor) {
      return new Color(jsfColor, theme);
    }
  }

  // §5.1.2.2.22: Preset Color
  else if (tagName === 'prstClr') {
    const val = attr(elm, 'val');
    if (val in PRESET_COLORS) {
      const jsfColor = readDrawingMLColor(elm);
      if (jsfColor) {
        return new Color(jsfColor, theme);
      }
    }
  }

  // §5.1.2.2.33: System Color
  else if (tagName === 'sysClr') {
    // §5.1.12.58: Specifies the system color value
    const val = attr(elm, 'val');
    if (val && SYSTEM_COLORS[val.toLowerCase()]) {
      // FIXME: JSF Color has no equivalent of sysClr's lastClr (§5.1.12.28, specifies the colour
      // value that was last computed by the generating application).
      const jsfColor = readDrawingMLColor(elm);
      if (jsfColor) {
        return new Color(jsfColor, theme);
      }
    }
  }
  else if (tagName) {
    throw new Error('Unknown color element: ' + tagName);
  }

  return undefined;
}
