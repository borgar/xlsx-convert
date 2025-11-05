/**
 * Convert a color from RGB (0-255, 0-255, 0-255) colorspace to HSL (0-360, 0-1, 0-1)
 */
export function rgbToHsl (r: number, g: number, b: number): [ number, number, number ] {
  r /= 255;
  g /= 255;
  b /= 255;
  const min = Math.min(r, g, b);
  const max = Math.max(r, g, b);
  let h = NaN;
  let s = max - min;
  const l = (max + min) / 2;
  if (s) {
    if (r === max) {
      h = (g - b) / s + (g < b ? 1 : 0) * 6;
    }
    else if (g === max) {
      h = (b - r) / s + 2;
    }
    else {
      h = (r - g) / s + 4;
    }
    s /= l < 0.5
      ? max + min
      : 2 - max - min;
    h *= 60;
  }
  else {
    s = l > 0 && l < 1
      ? 0
      : h;
  }
  return [ h, s, l ];
}
