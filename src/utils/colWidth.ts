/**
 * Convert an OOXML character-based column width to JSF pixels.
 *
 * `mdw` is the workbook Normal font's Max Digit Width. JSF pixels are 72-DPI (1px = 1pt), so
 * `mdw = round(digitAdvance / unitsPerEm * pointSize)` with the point size used directly as the em
 * size; the default 6 is Aptos Narrow 12 / Calibri 11 in that grid. The widely cited "Calibri 11 = 7"
 * is the 96-DPI OOXML/Windows rendering value (1pt = 1.333px) and is not JSF's coordinate system —
 * char widths are portable, and Windows Excel re-applies its own MDW when rendering, so the choice
 * cancels on a round-trip as long as read and write share this grid.
 *
 * Padding is ~5 pixels (cell margins + grid lines). Yields integer pixel widths for stability.
 */
export function colWidth (chars: number | null | undefined, padding = 0, mdw = 6): number | undefined {
  if (chars == null || Number.isNaN(chars)) {
    return undefined;
  }
  if (chars <= 0) {
    return 0;
  }
  // Excel's documented approximation
  return Math.floor(((chars * 256 + Math.floor(128 / mdw)) / 256) * mdw) + padding;
}
