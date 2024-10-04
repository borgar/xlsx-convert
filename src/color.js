import { rgb, hsl } from 'd3-color';
import attr, { numAttr } from './utils/attr.js';
import { NAMED_COLORS } from './constants.js';

function bound (c) {
  if (c < 0) { return 0; }
  if (c > 255) { return 255; }
  return ~~(c);
}

class Color {
  constuctor () {
    this.type = null;
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.a = 1;
  }

  rgb () {
    return rgb(this.r, this.g, this.b);
  }

  hsl () {
    return hsl(this.rgb());
  }

  toJSON () {
    return this.toString();
  }

  toRgba () {
    return `rgba(${bound(this.r)},${bound(this.g)},${bound(this.b)},${this.a})`;
  }

  toString () {
    if (!this.a) { // transparent
      return '#0000';
    }

    let s = '' +
      bound(this.r).toString(16).padStart(2, '0') +
      bound(this.g).toString(16).padStart(2, '0') +
      bound(this.b).toString(16).padStart(2, '0');

    if (this.a !== 1) {
      // skip alpha if color is opaque
      s += bound(this.a * 255).toString(16).padStart(2, '0');
    }

    // condense color if possible
    if (/^(.)\1(.)\2(.)\3(?:(.)\4)?$/.test(s)) {
      s = s[0] + s[2] + s[4] + (s[6] || '');
    }

    return '#' + s.toUpperCase();
  }
}

export default function (node, theme) {
  if (!node) { return null; }

  const color = new Color();

  let argb = attr(node, 'rgb'); // ARGB
  if (argb) {
    color.type = 'rgb';
    color.src = argb;
  }

  const indexed = attr(node, 'indexed');
  if (indexed) {
    color.type = 'index';
    color.src = indexed;
    argb = theme.indexedColors[+indexed];
  }

  // theme: A zero-based index into the <clrScheme> collection (§20.1.6.2),
  //        referencing a particular <sysClr> or <srgbClr> value expressed
  //        in the Theme part.
  const _theme = attr(node, 'theme');
  if (_theme && theme) {
    color.type = 'theme';
    color.src = _theme;
    argb = theme.scheme[_theme];
  }

  argb = argb && argb.toLowerCase();
  if (argb in NAMED_COLORS) {
    color.name = argb;
    argb = NAMED_COLORS[argb];
  }

  if (argb) {
    color.a = parseInt(argb.slice(0, 2), 16) / 255;
    color.r = parseInt(argb.slice(2, 4), 16);
    color.g = parseInt(argb.slice(4, 6), 16);
    color.b = parseInt(argb.slice(6, 8), 16);
  }

  const tint = numAttr(node, 'tint', 0);
  // tint: If tint is supplied, then it is applied to the RGB value of the color
  //       to determine the final color applied.
  // The tint value is stored as a double from -1.0 ... 1.0, where -1.0 means
  // 100% darken and 1.0 means 100% lighten. In loading the RGB value, it is
  // converted to HLS where HLS values are (0..HLSMAX), where HLSMAX is
  // currently 255.
  if (tint) {
    color.tint = tint;
    const h = color.hsl();
    if (tint < 0) { // darken
      const Ɛ = 1 + tint;
      h.l = Ɛ * h.l;
    }
    else { // lighten
      const Ɛ = 1 - tint;
      h.l = (Ɛ * h.l) + (1 - Ɛ);
    }
    const rgb = h.rgb();
    color.r = rgb.r;
    color.g = rgb.g;
    color.b = rgb.b;
  }

  return color.type ? color : null;
}
