export function toA1 (column: number, row: number): string {
  let n = column;
  let c = '';
  while (n >= 0) {
    c = String.fromCharCode(n % 26 + 65) + c;
    n = Math.floor(n / 26) - 1;
  }
  return c + (row + 1);
}
