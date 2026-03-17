import { clamp } from '../utils/clamp.ts';
import type { Theme } from '../handler/theme.ts';
import { hslToRgb } from './hslToRgb.ts';
import { parseARGB } from './parseARGB.ts';
import type { Color as JSFColor } from '@jsfkit/types';
import type { ColorOp } from './types.ts';
import { applyColorOps } from './applyColorOps.ts';

const indexToScheme = [
  'lt1',      //  0: Light 1
  'dk1',      //  1: Dark 1
  'lt2',      //  2: Light 2
  'dk2',      //  3: Dark 2
  'accent1',  //  4: Accent 1
  'accent2',  //  5: Accent 2
  'accent3',  //  6: Accent 3
  'accent4',  //  7: Accent 4
  'accent5',  //  8: Accent 5
  'accent6',  //  9: Accent 6
  'hlink',    // 10: Hyperlink
  'folHlink', // 11: Followed Hyperlink
];

export type RGBA = [number, number, number, number];
const hexValue = (n: number) => Math.trunc(clamp(0, n, 255)).toString(16).padStart(2, '0');

export class Color {
  type: 'theme' | 'rgb' | 'index' | 'hsl' | 'preset' | 'system';
  value: string;
  theme: Theme;
  rgba?: RGBA;
  hsla?: RGBA;
  ops: ColorOp[];

  constructor (theme: Theme) {
    this.type = 'preset';
    this.value = 'black';
    this.theme = theme;
    this.ops = [];
    this.hsla = [ 0, 0, 0, 0 ];
    this.rgba = [ 0, 0, 0, 0 ];
  }

  getJSF (): JSFColor {
    // Currently we always convert to string representation
    return this.toString() as any;
  }

  resolveRGBA (): RGBA {
    let rgba: RGBA = [ 0, 0, 0, 0 ];
    if (this.type === 'index') {
      rgba = parseARGB(this.theme.indexedColors[+this.value]);
    }
    else if (this.type === 'theme') {
      const key = indexToScheme[+this.value];
      rgba = parseARGB(this.theme.scheme[key]);
    }
    else if (this.type === 'rgb') {
      rgba = this.rgba;
    }
    else if (this.type === 'hsl') {
      rgba = hslToRgb(...this.hsla);
    }
    else if (this.type === 'preset') {
      rgba = parseARGB(this.value ?? '000000');
    }
    else if (this.type === 'system') {
      rgba = parseARGB(this.value ?? '000000');
    }
    return applyColorOps(rgba, this.ops);
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
