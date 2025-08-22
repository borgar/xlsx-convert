export function toInt (n: string | number | null): number {
  return n == null ? null : Math.floor(+n);
}

export function toNum (n: string | null): number {
  if (n == null) { return null; }
  if (/[.Ee]/.test(n)) {
    return Number(n);
  }
  return toInt(n);
}

