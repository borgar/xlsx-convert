import { clamp } from '../utils/clamp.ts';
import { hslToRgb } from './hslToRgb.ts';
import { rgbToHsl } from './rgbToHsl.ts';
import type { RGBA } from './Color.ts';
import { tint } from './tint.ts';
import type { ColorOp } from './types.ts';

const HSL_OPS = {
  hue: 1,
  hueMod: 1,
  hueOff: 1,
  sat: 1,
  satMod: 1,
  satOff: 1,
  lum: 1,
  lumMod: 1,
  lumOff: 1,
  comp: 1,
};

export function applyColorOps (
  rgba: RGBA,
  ops: ColorOp[],
): RGBA {
  let [ r, g, b, a ] = rgba;
  let h: number, s: number, l: number;
  for (const op of ops) {
    const type = op.type;
    const isHSL = type in HSL_OPS;

    // if the upcoming transformation is in HSL space, convert color from RGB
    if (isHSL) {
      [ h, s, l ] = rgbToHsl(r, g, b);
    }

    // RGB channel transformations
    if (type === 'red') { r = op.value; }
    else if (type === 'redMod') { r *= op.value; }
    else if (type === 'redOff') { r += op.value; }
    else if (type === 'green') { g = op.value; }
    else if (type === 'greenMod') { g *= op.value; }
    else if (type === 'greenOff') { g += op.value; }
    else if (type === 'blue') { b = op.value; }
    else if (type === 'blueMod') { b *= op.value; }
    else if (type === 'blueOff') { b += op.value; }

    // HSL channel transformations
    else if (type === 'hue') { h = op.value; }
    else if (type === 'hueMod') { h *= op.value; }
    else if (type === 'hueOff') { h += op.value; }
    else if (type === 'sat') { s = op.value; }
    else if (type === 'satMod') { s *= op.value; }
    else if (type === 'satOff') { s += op.value; }
    else if (type === 'lum') { l = op.value; }
    else if (type === 'lumMod') { l *= op.value; }
    else if (type === 'lumOff') { l += op.value; }
    else if (type === 'comp') {
      // §5.1.2.2.7: The color rendered should be the complement of its input color
      h = (h + 180) % 360;
    }

    // Alpha channel transformations
    else if (type === 'alpha') { a = op.value; }
    else if (type === 'alphaMod') { a *= op.value; }
    else if (type === 'alphaOff') { a += op.value; }

    // §5.1.2.2.17: Inverse; specifies the inverse of its input color.
    else if (op.type === 'inv') {
      r = 255 - r;
      g = 255 - g;
      b = 255 - b;
    }

    // §5.1.2.2.8/§5.1.2.2.18: Gamma / Inverse Gamma
    else if (op.type === 'gamma') {
      // The output color rendered should be the sRGB gamma shift of the input color.
      r = r ** (1 / 2.2);
      g = g ** (1 / 2.2);
      b = b ** (1 / 2.2);
    }
    else if (op.type === 'invGamma') {
      // The output color rendered by should be the inverse sRGB gamma shift of the input color.
      r = r <= 0.04045 ? r / 12.92 : ((r + 0.055) / 1.055) ** 2.4;
      g = g <= 0.04045 ? g / 12.92 : ((g + 0.055) / 1.055) ** 2.4;
      b = b <= 0.04045 ? b / 12.92 : ((b + 0.055) / 1.055) ** 2.4;
    }

    // gray (Gray) §5.1.2.2.9
    if (op.type === 'gray') {
      // Grayscale of the input color, taking into relative intensities of the RGB primaries.
      // We use the WCAG2.1 rel.lum.: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
      const lum = (
        0.2126 * (r <= 0.03928 ? r / 12.92 : ((r + 0.055) / 1.055) ** 2.4) +
        0.7152 * (g <= 0.03928 ? g / 12.92 : ((g + 0.055) / 1.055) ** 2.4) +
        0.0722 * (b <= 0.03928 ? b / 12.92 : ((b + 0.055) / 1.055) ** 2.4)
      );
      r = lum;
      g = lum;
      b = lum;
    }

    else if (op.type === 'tint') {
      [ r, g, b ] = tint(r, g, b, op.value);
    }
    else if (op.type === 'shade') {
      [ r, g, b ] = tint(r, g, b, -op.value);
    }

    // if transformation used HSL space, convert color back to RGB
    if (isHSL) {
      [ r, g, b ] = hslToRgb(h, s, l);
    }
  }

  return [
    Math.trunc(clamp(0, r ?? 0, 255)),
    Math.trunc(clamp(0, g ?? 0, 255)),
    Math.trunc(clamp(0, b ?? 0, 255)),
    clamp(0, a ?? 0, 1),
  ];
}
