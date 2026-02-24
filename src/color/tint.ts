import { hslToRgb } from './hslToRgb.ts';
import { rgbToHsl } from './rgbToHsl.ts';

export function tint (
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
