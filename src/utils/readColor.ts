import type { Element } from '@borgar/simple-xml';
import { attr, numAttr } from '../utils/attr.ts';
import type { Theme } from '../handler/theme.ts';
import { Color } from '../color.ts';
import { SYSTEM_COLORS, PRESET_COLORS, SCHEME_COLORS } from '../constants.ts';
import { parseARGB } from './parseARGB.ts';

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
  const tagName = elm?.tagName;
  // §3.8.3 - bgColor
  // §3.8.18 - fgColor
  // §3.3.1.14 - color
  if (tagName === 'color' || tagName === 'fgColor' || tagName === 'bgColor') {
    const color = new Color(theme);
    // Element may have any of the following attributes:
    // - [auto]    - A boolean value indicating the color is automatic and system color dependent.
    // - [indexed] - References a color in indexedColors.
    // - [rgb]     - Standard Alpha Red Green Blue color value (ARGB).
    // - [theme]   - Index into the <clrScheme> collection, referencing a particular <sysClr> or
    //               <srgbClr> value expressed in the Theme part.
    // As well as:
    // - [tint]    - Specifies the tint value applied to the color (-1.0 .. 1.0)
    const argb = attr(elm, 'rgb', ''); // ARGB
    if (argb) {
      color.type = 'rgb';
      color.rgba = parseARGB(argb);
    }
    else {
      const indexed = attr(elm, 'indexed', '');
      if (indexed) {
        color.type = 'index';
        color.value = indexed;
      }
      else {
        // theme: A zero-based index into the <clrScheme> collection (§20.1.6.2),
        //        referencing a particular <sysClr> or <srgbClr> value expressed
        //        in the Theme part.
        const _theme = attr(elm, 'theme');
        if (_theme && theme) {
          color.type = 'theme';
          color.value = _theme;
        }
      }
    }
    const tint = numAttr(elm, 'tint', 0);
    if (tint < 0) {
      color.ops.shade = -tint;
    }
    else if (tint > 0) {
      color.ops.tint = tint;
    }
    return color;
  }

  // §5.1.2.2.29: Scheme Color - "specifies a color bound to a user's theme"
  else if (tagName === 'schemeClr') {
    const val = attr(elm, 'val');
    if (SCHEME_COLORS[val]) {
      const color = new Color(theme);
      color.type = 'theme';
      color.value = SCHEME_COLORS[val] ?? SCHEME_COLORS.phClr;
      return color;
    }
  }

  // §5.1.2.2.13: HSL Color Model - "a perceptual gamma of 2.2 is assumed"
  else if (tagName === 'hslClr') {
    const color = new Color(theme);
    color.type = 'hsl';
    color.hsla = [
      numAttr(elm, 'hue', 0) / 100000,
      numAttr(elm, 'sat', 0) / 100000,
      numAttr(elm, 'lum', 0) / 100000,
      1,
    ];
    return color;
  }

  // §5.1.2.2.22: Preset Color
  else if (tagName === 'prstClr') {
    const val = attr(elm, 'val');
    if (val in PRESET_COLORS) {
      const color = new Color(theme);
      color.type = 'preset';
      color.value = val;
      return color;
    }
  }

  // §5.1.2.2.30: RGB Color Model - Percentage Variant
  else if (tagName === 'scrgbClr') {
    // This element specifies a color using the red, green, blue RGB color model.
    // Each component, red, green, and blue is expressed as a percentage from
    // 0% to 100%. A linear gamma of 1.0 is assumed.
    const color = new Color(theme);
    color.type = 'hsl';
    color.rgba = [
      255 * numAttr(elm, 'r', 0) / 100000,
      255 * numAttr(elm, 'g', 0) / 100000,
      255 * numAttr(elm, 'b', 0) / 100000,
      1,
    ];
    return color;
  }

  // §5.1.2.2.32: RGB Color Model - Hex Variant
  else if (tagName === 'srgbClr') {
    // <srgbClr val="BCBCBC" />
    const color = new Color(theme);
    color.type = 'rgb';
    color.rgba = parseARGB(attr(elm, 'val', '0'));
    return color;
  }

  // §5.1.2.2.33: System Color
  else if (tagName === 'sysClr') {
    // §5.1.12.58: Specifies the system color value
    const val = attr(elm, 'val');
    if (val && SYSTEM_COLORS[val.toLowerCase()]) {
      const color = new Color(theme);
      color.type = 'system';
      color.value = val;
      const lastClr = attr(elm, 'lastClr');
      if (lastClr) {
        // §5.1.12.28: Specifies the color value that was last computed by the generating application.
        color.rgba = parseARGB(lastClr);
      }
      return color;
    }
  }

  if (tagName) {
    throw new Error('Unsupported color element: ' + tagName);
  }
}
