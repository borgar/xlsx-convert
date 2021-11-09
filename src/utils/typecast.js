export function toInt (n) {
  return n == null ? null : Math.floor(+n);
}

export function toNum (n) {
  if (n == null) { return null; }
  if (/[.Ee]/.test(n)) {
    return Number(n);
  }
  return toInt(n);
}

