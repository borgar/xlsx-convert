import { SYSTEM_COLORS, PRESET_COLORS } from '../constants.ts';

export function parseARGB (value: string): [ number, number, number, number ] {
  if (!value) {
    return [ 0, 0, 0, 1 ];
  }
  const lc = value.toLowerCase();
  if (lc in SYSTEM_COLORS) {
    value = SYSTEM_COLORS[lc];
  }
  if (value in PRESET_COLORS) {
    value = PRESET_COLORS[value];
  }
  if (value.length === 8) {
    const c = parseInt(value, 16);
    return [
      c >> 16 & 0xff,
      c >> 8 & 0xff,
      c & 0xff,
      (c >> 24 & 0xff) / 255,
    ];
  }
  if (value.length === 6) {
    const c = parseInt(value, 16);
    return [
      c >> 16 & 0xff,
      c >> 8 & 0xff,
      c & 0xff,
      1,
    ];
  }
  throw new Error('Cannot parse color: ' + value);
}
