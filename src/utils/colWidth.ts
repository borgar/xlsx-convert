/**
 * Convert Excel character-based column width to pixels.
 *
 * Based on common approximations of Excel's rendering:
 *
 * - MDW (Max Digit Width) ~ 7 pixels for Calibri 11
 * - A padding constant of ~5 pixels (margins + grid lines)
 *
 * Note: This yields integer pixel widths for stability.
 */
export function colWidth (chars: number, padding = 0, mdw = 6): number {
  if (chars == null || Number.isNaN(chars)) {
    return null;
  }
  if (chars <= 0) {
    return 0;
  }
  // Excel's documented approximation
  return Math.floor(((chars * 256 + Math.floor(128 / mdw)) / 256) * mdw) + padding;
}
