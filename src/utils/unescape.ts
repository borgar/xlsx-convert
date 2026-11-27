/**
 * Decode the `_xHHHH_` escapes of the OOXML `ST_Xstring` type (ECMA-376 Part 1, §22.9.2.19).
 *
 * The `x` is lowercase; the hex digits may be of either case. Escapes are decoded left to right
 * and consume their closing `_`, so `_x005F_x0041_` reads as the literal `_x0041_`.
 */
export function unescape (str: string): string {
  return str.replace(
    /_x([\da-fA-F]{4})_/g,
    (m, n) => String.fromCharCode(parseInt(n, 16)),
  );
}
