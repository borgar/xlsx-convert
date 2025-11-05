import { clamp } from './utils/clamp.ts';
import type { Theme } from './handler/theme.ts';
import { rgbToHsl } from './utils/rgbToHsl.ts';
import { hslToRgb } from './utils/hslToRgb.ts';
import { parseARGB } from './utils/parseARGB.ts';

const indexToScheme = [
  'lt1',       //  0: Light 1
  'dk1',       //  1: Dark 1
  'lt2',       //  2: Light 2
  'dk2',       //  3: Dark 2
  'accent1',   //  4: Accent 1
  'accent2',   //  5: Accent 2
  'accent3',   //  6: Accent 3
  'accent4',   //  7: Accent 4
  'accent5',   //  8: Accent 5
  'accent6',   //  9: Accent 6
  'hlink',     // 10: Hyperlink
  'folHlink',  // 11: Followed Hyperlink
];

const hexValue = (n: number) => Math.trunc(clamp(0, n, 255)).toString(16).padStart(2, '0');

function tint (
  r: number,
  g: number,
  b: number,
  amount: number,
): [ number, number, number ] | [ number, number, number, number ] {
  if (tint) {
    // eslint-disable-next-line prefer-const
    let [ h, s, l ] = rgbToHsl(r, g, b);
    if (amount < 0) { // darken
      const Ɛ = 1 + amount;
      l = Ɛ * l;
    }
    else { // lighten
      const Ɛ = 1 - amount;
      l = (Ɛ * l) + (1 - Ɛ);
    }
    return hslToRgb(h, s, l);
  }
  return [ r, g, b ];
}

function updateChannel (value, set, mod, off) {
  if (set != null) {
    return set;
  }
  else if (mod != null) {
    return value * mod;
  }
  else if (off != mod) {
    return value + off;
  }
  return value;
}

export class Color {
  type: 'theme' | 'rgb' | 'index' | 'hsl' | 'preset' | 'system';
  value: string;
  theme?: Theme;
  rgba?: [ number, number, number, number ];
  hsla?: [ number, number, number, number ];
  ops: {
    alpha?: number,
    alphaMod?: number,
    alphaOff?: number,
    blue?: number,
    blueMod?: number,
    blueOff?: number,
    green?: number,
    greenMod?: number,
    greenOff?: number,
    red?: number,
    redMod?: number,
    redOff?: number,
    hue?: number,
    hueMod?: number,
    hueOff?: number,
    sat?: number,
    satMod?: number,
    satOff?: number,
    lum?: number,
    lumMod?: number,
    lumOff?: number,
    comp?: boolean,
    gamma?: boolean,
    gray?: boolean,
    inv?: boolean,
    invGamma?: boolean,
    shade?: number,
    tint?: number,
  };

  constructor (theme?: Theme) {
    this.type = 'preset';
    this.value = 'black';
    this.theme = theme;
    this.ops = {};
  }

  getJSF () {
    // Currently we always convert to string representation
    return this.toString();
  }

  resolveRGBA (): [ number, number, number, number ] {
    let r = 0;
    let g = 0;
    let b = 0;
    let a = 0;
    if (this.type === 'index') {
      [ r, g, b, a ] = parseARGB(this.theme.indexedColors[+this.value]);
    }
    else if (this.type === 'theme') {
      const key = indexToScheme[+this.value];
      [ r, g, b, a ] = parseARGB(this.theme.scheme[key]);
    }
    else if (this.type === 'rgb') {
      [ r, g, b, a ] = this.rgba;
    }
    else if (this.type === 'hsl') {
      [ r, g, b, a ] = hslToRgb(...this.hsla);
    }
    else if (this.type === 'preset') {
      [ r, g, b, a ] = parseARGB(this.value ?? '000000');
    }
    else if (this.type === 'system') {
      [ r, g, b, a ] = parseARGB(this.value ?? '000000');
    }

    const mod = this.ops;
    // RGB transformations
    r = updateChannel(r, mod.red, mod.redMod, mod.redOff);
    g = updateChannel(g, mod.green, mod.greenMod, mod.greenOff);
    b = updateChannel(b, mod.blue, mod.blueMod, mod.blueOff);
    // HSL transformations
    if (
      (mod.hue != null || mod.hueMod || mod.hueOff) ||
      (mod.sat != null || mod.satMod || mod.satOff) ||
      (mod.lum != null || mod.lumMod || mod.lumOff) ||
      mod.comp
    ) {
      let [ h, s, l ] = rgbToHsl(r, g, b);
      h = updateChannel(h, mod.hue, mod.hueMod, mod.hueOff);
      s = updateChannel(h, mod.sat, mod.satMod, mod.satOff);
      l = updateChannel(h, mod.lum, mod.lumMod, mod.lumOff);
      // §5.1.2.2.7: The color rendered should be the complement of its input color
      if (mod.comp) {
        h = (h + 180) % 360;
      }
      [ r, g, b ] = hslToRgb(h, s, l);
    }
    //
    a = updateChannel(a, mod.alpha, mod.alphaMod, mod.alphaOff);

    // §5.1.2.2.17: Inverse; specifies the inverse of its input color.
    if (mod.inv) {
      r = 255 - r;
      g = 255 - g;
      b = 255 - b;
    }

    // §5.1.2.2.8/§5.1.2.2.18: Gamma / Inverse Gamma
    if (mod.gamma) {
      // The output color rendered should be the sRGB gamma shift of the input color.
      r = r ** (1 / 2.2);
      g = g ** (1 / 2.2);
      b = b ** (1 / 2.2);
    }
    else if (mod.invGamma) {
      // The output color rendered by should be the inverse sRGB gamma shift of the input color.
      r = r <= 0.04045 ? r / 12.92 : ((r + 0.055) / 1.055) ** 2.4;
      g = g <= 0.04045 ? g / 12.92 : ((g + 0.055) / 1.055) ** 2.4;
      b = b <= 0.04045 ? b / 12.92 : ((b + 0.055) / 1.055) ** 2.4;
    }

    // gray (Gray) §5.1.2.2.9
    if (mod.gray) {
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

    if (mod.tint) {
      [ r, g, b ] = tint(r, g, b, mod.tint);
    }
    else if (mod.shade) {
      [ r, g, b ] = tint(r, g, b, -mod.shade);
    }

    return [
      Math.trunc(clamp(0, r ?? 0, 255)),
      Math.trunc(clamp(0, g ?? 0, 255)),
      Math.trunc(clamp(0, b ?? 0, 255)),
      clamp(0, a ?? 0, 1),
    ];
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
