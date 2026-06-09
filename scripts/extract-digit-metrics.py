#!/usr/bin/env python3
"""Regenerate the DIGIT_METRICS literal in src/utils/mdw.ts.

For each font in FONTS, reads unitsPerEm (head table) and the widest advance over digits 0-9
(hmtx table) from the font file, and prints the TypeScript literal. See mdw.ts for the font set
and how those metrics become an MDW.

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
