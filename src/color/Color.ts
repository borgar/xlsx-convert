import type { Color as JSFColor, Theme } from '@jsfkit/types';
import { COLOR_INDEX, SCHEME_ALIASES } from '../constants.ts';
import { clamp } from '../utils/clamp.ts';
import { hslToRgb } from './hslToRgb.ts';
import { parseARGB } from './parseARGB.ts';
import { applyColorOps } from './applyColorOps.ts';

export type RGBA = [number, number, number, number];
const hexValue = (n: number) => Math.trunc(clamp(0, n, 255)).toString(16).padStart(2, '0');

/**
 * Resolves a JSFKit Color object to an RGBA tuple. Handles all colour types except theme (which
 * requires a theme reference to look up the colour scheme).
 */
function resolveJSFColorToRGBA (color: JSFColor): RGBA {
  if (color.type === 'srgb') {
    return parseARGB(color.value);
  }
  else if (color.type === 'scrgb') {
    return [
      Math.round(color.red / 100 * 255),
      Math.round(color.green / 100 * 255),
      Math.round(color.blue / 100 * 255),
      1,
    ];
  }
  else if (color.type === 'hsl') {
    // hslToRgb expects hue in 0–360, saturation and lightness in 0–1
    return hslToRgb(color.hue, color.saturation / 100, color.lightness / 100);
  }
  else if (color.type === 'system' || color.type === 'preset') {
    return parseARGB(color.value);
  }
  else if (color.type === 'indexed') {
    return parseARGB(COLOR_INDEX[color.value]);
  }
  // Auto colour or theme colour.
  return [ 0, 0, 0, 1 ];
}

export class Color {
  jsfColor: JSFColor;
  theme: Theme;
  /**
   * The resolved RGBA value for this colour, if already computed. Undefined until first resolution.
   * Access this value through {@link Color.resolveRGBA}.
   *
   * @private
   */
  _rgba: RGBA | undefined;

  constructor (color: JSFColor, theme: Theme) {
    this.jsfColor = color;
    this.theme = theme;
  }

  /** Returns the lossless JSFKit Color object. */
  getJSF (): JSFColor {
    return this.jsfColor;
  }

  /**
   * Resolves this colour to an RGBA tuple (0–255 for RGB, 0–1 for alpha), applying theme lookups
   * and any transforms. The result is cached.
   */
  resolveRGBA (): RGBA {
    if (this._rgba) {
      return this._rgba;
    }
    let rgba: RGBA = [ 0, 0, 0, 1 ];
    if (this.jsfColor.type === 'theme') {
      const key = SCHEME_ALIASES[this.jsfColor.value] ?? this.jsfColor.value;
      const themeColor = this.theme.colorScheme[key];
      if (themeColor) {
        rgba = resolveJSFColorToRGBA(themeColor);
        if (themeColor.transforms) {
          rgba = applyColorOps(rgba, themeColor.transforms);
        }
      }
    }
    else {
      rgba = resolveJSFColorToRGBA(this.jsfColor);
    }
    if (this.jsfColor.transforms) {
      rgba = applyColorOps(rgba, this.jsfColor.transforms);
    }
    this._rgba = rgba;
    return rgba;
  }

  toString () {
    const [ r, g, b, a ] = this.resolveRGBA();

    // transparent
    if (!a) { return '#0000'; }

    let s = hexValue(r) + hexValue(g) + hexValue(b);

    // add alpha if color is not opaque
    if (a !== 1) {
      s += hexValue(a * 255);
    }

    // condense color string when possible
    if (/^(.)\1(.)\2(.)\3(?:(.)\4)?$/.test(s)) {
      s = s[0] + s[2] + s[4] + (s[6] || '');
    }

    return '#' + s.toUpperCase();
  }
}
