#!/usr/bin/env python3
"""Extract the digit-advance / unitsPerEm metrics behind src/utils/mdw.ts.

A workbook's Max Digit Width (MDW) is `round(maxDigitAdvance / unitsPerEm * pointSize)` in JSF's
72-DPI grid (1px = 1pt). This script reads `unitsPerEm` (head) and the widest advance over digits
0-9 (hmtx) straight from the font files Excel renders with, so the constants in mdw.ts can be
re-derived and scrutinised rather than trusted as magic numbers.

Font set mirrors @grid-is/glyph-widths, whose advances were measured from live Excel autofit; the
values printed here were cross-checked against that package and agree to within 1px at 12pt. Eight
families ship in Excel's DFonts; Georgia is not Office-bundled, so it is read from the macOS system
copy. Georgia uses proportional (old-style) figures, but its `0` glyph is also its widest digit, so
the spec-literal "maximum digit" is unambiguous for every family here.

Requires macOS with Microsoft Excel installed and `fonttools` (`pip install fonttools`).
Run:  python3 scripts/extract-digit-metrics.py
"""
from fontTools.ttLib import TTFont

DFONTS = '/Applications/Microsoft Excel.app/Contents/Resources/DFonts/'

# family -> font file (8 from Excel's DFonts, Georgia from the macOS system font)
FONTS = {
    'Aptos Narrow':    DFONTS + 'Aptos-Narrow.ttf',
    'Aptos':           DFONTS + 'Aptos.ttf',
    'Calibri':         DFONTS + 'Calibri.ttf',
    'Calibri Light':   DFONTS + 'calibril.ttf',
    'Arial':           DFONTS + 'arial.ttf',
    'Times New Roman': DFONTS + 'times.ttf',
    'Verdana':         DFONTS + 'Verdana.ttf',
    'Georgia':         '/System/Library/Fonts/Supplemental/Georgia.ttf',
    'Tahoma':          DFONTS + 'tahoma.ttf',
}
DIGITS = range(ord('0'), ord('9') + 1)


def metrics(path):
    font = TTFont(path)
    cmap = font.getBestCmap()
    hmtx = font['hmtx']
    advances = [hmtx[cmap[cp]][0] for cp in DIGITS]
    return font['head'].unitsPerEm, max(advances)


if __name__ == '__main__':
    print("const DIGIT_METRICS: Record<string, DigitMetric> = {")
    for family, path in FONTS.items():
        upm, advance = metrics(path)
        print(f"  '{family.lower()}': {{ advance: {advance}, upm: {upm} }},")
    print("};")
