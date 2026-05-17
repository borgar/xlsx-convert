export function toInt<T extends string | number | null> (n: T): T extends null ? null : number {
  return (n == null ? null : Math.floor(+n)) as never;
}

export function toNum<T extends string | null> (n: T): T extends null ? null : number {
  if (n == null) { return null as never; }
  if (/[.Ee]/.test(n)) { return Number(n) as never; }
  return toInt(n);
}
