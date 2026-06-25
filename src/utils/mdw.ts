/**
 * Maximum Digit Width (MDW) for a workbook's Normal font.
 *
 * Excel records every column width in character units of the workbook Normal font's MDW — the pixel
 * advance of its widest digit, rounded. Converting those widths to pixels therefore needs the Normal
 * font's true MDW, not a fixed constant. `MDW = round(digitAdvance / unitsPerEm * pointSize)`, with
 * `pointSize` used directly as the em size (no 96/72 DPI factor) — the coordinate convention in which
 * Aptos Narrow 12 yields MDW 6.
 *
 * Metrics below are the digit advance / unitsPerEm read from the font files Excel for Mac renders
 * with — its bundled DFonts, except Georgia, which is not Office-bundled and comes from the macOS
 * system copy. Regenerate with `scripts/extract-digit-metrics.py`. Unknown fonts fall back to
 * {@link DEFAULT_MDW}; supply a resolver to cover arbitrary fonts.
 */

/** Resolve an MDW for an arbitrary font. Returning null/undefined defers to the built-in table. */
export type MdwResolver = (fontFamily: string, fontSizePt: number) => number | null | undefined;

type DigitMetric = {
  advance: number;
  upm: number;
};

const DIGIT_METRICS: Record<string, DigitMetric> = {
  'aptos narrow': { advance: 1038, upm: 2048 },
  'aptos': { advance: 1094, upm: 2048 },
  'calibri': { advance: 1038, upm: 2048 },
  'calibri light': { advance: 1038, upm: 2048 },
  'arial': { advance: 1139, upm: 2048 },
  'times new roman': { advance: 1024, upm: 2048 },
  'verdana': { advance: 1302, upm: 2048 },
  'georgia': { advance: 1257, upm: 2048 },
  'tahoma': { advance: 1118, upm: 2048 },
};

/** Fallback MDW (Aptos Narrow / Calibri 11–12), used when the Normal font is unknown. */
export const DEFAULT_MDW = 6;

/**
 * MDW for a known font at a given point size, or `undefined` if the font has no metrics and no
 * resolver supplies one.
 */
export function maxDigitWidth (fontFamily: string, fontSizePt: number, resolve?: MdwResolver): number | undefined {
  const override = resolve?.(fontFamily, fontSizePt);
  if (override != null) {
    return override;
  }
  const metric = DIGIT_METRICS[fontFamily.trim().toLowerCase()];
  if (metric === undefined) {
    return undefined;
  }
  return Math.round((metric.advance / metric.upm) * fontSizePt);
}

/**
 * MDW for the Normal font, falling back to {@link DEFAULT_MDW} (with a warning) when the font is
 * unknown and no resolver covers it.
 */
export function resolveColumnMdw (
  fontFamily: string,
  fontSizePt: number,
  options: { resolveMdw?: MdwResolver; warn?: (message: string) => void } = {},
): number {
  const mdw = maxDigitWidth(fontFamily, fontSizePt, options.resolveMdw);
  if (mdw === undefined) {
    options.warn?.(
      `No digit-width metrics for Normal font "${fontFamily}" at ${fontSizePt}pt; column widths fall ` +
      `back to MDW=${DEFAULT_MDW} and may be mis-scaled. Supply options.resolveMdw to handle this font.`,
    );
    return DEFAULT_MDW;
  }
  return mdw;
}
