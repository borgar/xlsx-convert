/**
 * There are 914400 EMUs per inch.
 * EMUs can be converted to pixels by calculating EMUs * DPI / 914400.
 */
export function emu2px (emu: number, precision = 1e3) {
  return Math.round(emu * 96 / 914400 * precision) / precision;
}
