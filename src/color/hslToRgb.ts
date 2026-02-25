/* From FvD 13.37, CSS Color Module Level 3 */
function hsl2rgb (h: number, m1: number, m2: number): number {
  return (
    h < 60
      ? m1 + (m2 - m1) * h / 60
      : h < 180
        ? m2
        : h < 240
          ? m1 + (m2 - m1) * (240 - h) / 60
          : m1
  ) * 255;
}

export function hslToRgb (
  hue: number,
  sat: number,
  lum: number,
  alpha: number = 1,
): [ number, number, number, number ] {
  const h = hue % 360 + (hue < 0 ? 1 : 0) * 360;
  const s = isNaN(hue) || isNaN(sat) ? 0 : sat;
  const m2 = lum + (lum < 0.5 ? lum : 1 - lum) * s;
  const m1 = 2 * lum - m2;
  return [
    hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
    hsl2rgb(h, m1, m2),
    hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
    alpha,
  ];
}
