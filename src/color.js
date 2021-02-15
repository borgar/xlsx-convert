const attr = require('./utils/attr');
const d3 = require('d3-color');

// Default Color Index as per 18.8.27 of ECMA Part 4
const COLOR_INDEX = [
  'FF000000', 'FFFFFFFF', 'FFFF0000', 'FF00FF00', 'FF0000FF', // 0-4
  'FFFFFF00', 'FFFF00FF', 'FF00FFFF', 'FF000000', 'FFFFFFFF', // 5-9
  'FFFF0000', 'FF00FF00', 'FF0000FF', 'FFFFFF00', 'FFFF00FF', // 10-14
  'FF00FFFF', 'FF800000', 'FF008000', 'FF000080', 'FF808000', // 15-19
  'FF800080', 'FF008080', 'FFC0C0C0', 'FF808080', 'FF9999FF', // 20-24
  'FF993366', 'FFFFFFCC', 'FFCCFFFF', 'FF660066', 'FFFF8080', // 25-29
  'FF0066CC', 'FFCCCCFF', 'FF000080', 'FFFF00FF', 'FFFFFF00', // 30-34
  'FF00FFFF', 'FF800080', 'FF800000', 'FF008080', 'FF0000FF', // 35-39
  'FF00CCFF', 'FFCCFFFF', 'FFCCFFCC', 'FFFFFF99', 'FF99CCFF', // 40-44
  'FFFF99CC', 'FFCC99FF', 'FFFFCC99', 'FF3366FF', 'FF33CCCC', // 45-49
  'FF99CC00', 'FFFFCC00', 'FFFF9900', 'FFFF6600', 'FF666699', // 50-54
  'FF969696', 'FF003366', 'FF339966', 'FF003300', 'FF333300', // 55-59
  'FF993300', 'FF993366', 'FF333399', 'FF333333', 'System Foreground', // 60-64
  'System Background' // 65
];

// https://social.technet.microsoft.com/Forums/windows/en-US/ac76cc56-6ff2-4778-b260-8141d7170a3b/windows-7-highlight-text-color-or-selected-text-color-in-aero
const NAMED_COLORS = {
  // not sure why this is reversed?
  'system foreground': 'FF000000',
  'system background': 'FFFFFFFF',
  // 'system foreground': 'FFFFFFFF',
  // 'system background': 'FF000000',
  'activeborder': 'FFB4B4B4',
  'activetitle': 'FF99B4D1',
  'appworkspace': 'FFABABAB',
  'background': 'FF000000',
  'buttonalternateface': 'FF000000',
  'buttondkshadow': 'FF696969',
  'buttonface': 'FFF0F0F0',
  'buttonhilight': 'FFFFFFFF',
  'buttonlight': 'FFE3E3E3',
  'buttonshadow': 'FFA0A0A0',
  'buttontext': 'FF000000',
  'gradientactivetitle': 'FFB9D1EA',
  'gradientinactivetitle': 'FFD7E4F2',
  'graytext': 'FF6D6D6D',
  'hilight': 'FF3399FF',
  'hilighttext': 'FFFFFFFF',
  'hottrackingcolor': 'FF0066CC',
  'inactiveborder': 'FFF4F7FC',
  'inactivetitle': 'FFBFCDDB',
  'inactivetitletext': 'FF000000',
  'infotext': 'FF000000',
  'infowindow': 'FFFFFFE1',
  'menu': 'FFF0F0F0',
  'menubar': 'FFF0F0F0',
  'menuhilight': 'FF3399FF',
  'menutext': 'FF000000',
  'scrollbar': 'FFC8C8C8',
  'titletext': 'FF000000',
  'window': 'FFFFFFFF',
  'windowframe': 'FF646464',
  'windowtext': 'FF000000'
};

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
    return d3.rgb(this.r, this.g, this.b);
  }

  hsl () {
    return d3.hsl(this.rgb());
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

module.exports = (node, theme) => {
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
    argb = COLOR_INDEX[+indexed];
  }

  // theme: A zero-based index into the <clrScheme> collection (§20.1.6.2), referencing
  //        a particular <sysClr> or <srgbClr> value expressed in the Theme part.
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

  const tint = +attr(node, 'tint', 0);
  // tint: If tint is supplied, then it is applied to the RGB value of the color to determine the final color applied.
  // The tint value is stored as a double from -1.0 ... 1.0, where -1.0 means 100% darken and 1.0 means 100% lighten.
  // In loading the RGB value, it is converted to HLS where HLS values are (0..HLSMAX), where HLSMAX is currently 255.
  if (tint) {
    color.tint = tint;
    const h = color.hsl();
    if (tint < 0) { // darken
      const Ɛ = 1 + tint;
      h.l = Ɛ * h.l;
    }
    else { // lighten
      const Ɛ = 1 - tint;
      h.l = Ɛ * h.l + (1 - Ɛ);
    }
    const rgb = h.rgb();
    color.r = rgb.r;
    color.g = rgb.g;
    color.b = rgb.b;
  }

  return color.type ? color : null;
};
