import type { RangeA1 } from '@borgar/fx';

const CHAR_DOLLAR = 36;
const CHAR_COLON = 58;
const CHAR_A_LC = 97;
const CHAR_A_UC = 65;
const CHAR_Z_LC = 122;
const CHAR_Z_UC = 90;
const CHAR_0 = 48;
const CHAR_9 = 57;

export function fromA1 (source: string): RangeA1 | null {
  let top = 0;
  let left = 0;
  let bottom = undefined;
  let right = undefined;

  const len = source.length;
  let pos = 0;
  let check = 0;

  // skip dollar
  if (pos < len && source.charCodeAt(pos) === CHAR_DOLLAR) {
    pos++;
  }
  // get A-Z
  check = pos;
  do {
    const c = source.charCodeAt(pos);
    if (c >= CHAR_A_UC && c <= CHAR_Z_UC) {
      left = (left * 26) + (c - CHAR_A_UC + 1);
    }
    else if (c >= CHAR_A_LC && c <= CHAR_Z_LC) {
      left = (left * 26) + (c - CHAR_A_LC + 1);
    }
    else {
      break;
    }
    pos++;
  }
  while (pos < len);
  // ref is invalid if no char was read
  if (check === pos || left <= 0 || left > 16384) {
    return null;
  }
  // skip dollar
  if (pos < len && source.charCodeAt(pos) === CHAR_DOLLAR) {
    pos++;
  }
  // get 0-9
  check = pos;
  do {
    const c = source.charCodeAt(pos);
    if (c >= CHAR_0 && c <= CHAR_9) {
      top = (top * 10) + (c - CHAR_0);
    }
    else {
      break;
    }
    pos++;
  }
  while (pos < len);
  // ref is invalid if no char was read
  if (check === pos || top <= 0 || top > 1048576) {
    return null;
  }

  // colon (and second half)
  if (pos < len && source.charCodeAt(pos) === CHAR_COLON) { // pos must be len-3 because :A1 is minimal
    pos++;
    bottom = 0;
    right = 0;

    // skip dollar
    if (pos < len && source.charCodeAt(pos) === CHAR_DOLLAR) {
      pos++;
    }
    // get A-Z
    check = pos;
    do {
      const c = source.charCodeAt(pos);
      if (c >= CHAR_A_UC && c <= CHAR_Z_UC) {
        right = right * 26 + (c - CHAR_A_UC + 1);
      }
      else if (c >= CHAR_A_LC && c <= CHAR_Z_LC) {
        right = right * 26 + (c - CHAR_A_LC + 1);
      }
      else {
        break;
      }
      pos++;
    }
    while (pos < len);
    // ref is invalid if no char was read
    if (check === pos || right <= 0 || right > 16384) {
      return null;
    }

    // skip dollar
    if (pos < len && source.charCodeAt(pos) === CHAR_DOLLAR) {
      pos++;
    }
    // get 0-9
    check = pos;
    do {
      const c = source.charCodeAt(pos);
      if (c >= CHAR_0 && c <= CHAR_9) {
        bottom = bottom * 10 + (c - CHAR_0);
      }
      else {
        break;
      }
      pos++;
    }
    while (pos < len);
    // ref is invalid if no char was read
    if (check === pos || bottom <= 0 || bottom > 1048576) {
      return null;
    }
  }

  // if we're not at the end, this has gone wrong
  if (pos < len) {
    return null;
  }

  if (bottom === undefined) {
    return {
      top: top - 1,
      left: left - 1,
      bottom: top - 1,
      right: left - 1,
    };
  }

  return {
    top: Math.min(top, bottom) - 1,
    left: Math.min(left, right) - 1,
    bottom: Math.max(top, bottom) - 1,
    right: Math.max(left, right) - 1,
  };
}
