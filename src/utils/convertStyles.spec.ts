import { describe, expect, it } from 'vitest';
import type { Color } from '@jsfkit/types';

import { BUILTIN_FORMATS } from '../constants.ts';
import type { StyleDefs } from '../handler/styles.ts';
import { convertStyles } from './convertStyles.ts';

type Xf = StyleDefs['cellXf'][number];

const red: Color = { type: 'srgb', value: 'FF0000' };
const blue: Color = { type: 'srgb', value: '0000FF' };
const dk1: Color = { type: 'theme', value: 'dk1' };
const sysFg: Color = { type: 'indexed', value: 64 };

function defs (props: Partial<StyleDefs> = {}): StyleDefs {
  return {
    cellStyleXfs: [],
    cellXf: [],
    cellStyles: [],
    fill: [],
    font: [],
    numFmts: { ...BUILTIN_FORMATS },
    border: [],
    diffStyles: [],
    ...props,
  };
}

/** Convert a single cell xf and return its style. */
function style (xf: Xf, props: Partial<StyleDefs> = {}) {
  return convertStyles(defs({ cellXf: [ xf ], ...props })).styles[0];
}

describe('convertStyles', () => {
  describe('input', () => {
    it('returns empty results for a workbook without a styles part', () => {
      expect(convertStyles(null)).toEqual({ styles: [], namedStyles: {} });
    });

    it('returns empty results for empty style definitions', () => {
      expect(convertStyles(defs())).toEqual({ styles: [], namedStyles: {} });
    });

    it('converts every cell xf in order', () => {
      const { styles } = convertStyles(defs({
        cellXf: [ {}, { hAlign: 'left' }, { hAlign: 'right' } ],
      }));
      expect(styles).toEqual([
        {},
        { horizontalAlignment: 'left' },
        { horizontalAlignment: 'right' },
      ]);
    });

    it('omits xf properties that have no JSF equivalent', () => {
      expect(style({
        fontId: 0,
        fillId: 0,
        borderId: 0,
        textIndent: 2,
        unlocked: true,
        hidden: true,
        checkbox: true,
      })).toEqual({});
    });
  });

  describe('number formats', () => {
    it('omits format 0 (General)', () => {
      expect(style({ numFmtId: 0 })).toEqual({});
    });

    it('reads a built-in format', () => {
      expect(style({ numFmtId: 2 })).toEqual({ numberFormat: '0.00' });
    });

    it('reads a custom format', () => {
      expect(style(
        { numFmtId: 164 },
        { numFmts: { ...BUILTIN_FORMATS, 164: '0.000%' } },
      )).toEqual({ numberFormat: '0.000%' });
    });

    it('omits a custom format that is "General" in any case', () => {
      expect(style({ numFmtId: 164 }, { numFmts: { 164: 'GENERAL' } })).toEqual({});
      expect(style({ numFmtId: 164 }, { numFmts: { 164: 'general' } })).toEqual({});
    });

    it('omits a format id that is not defined', () => {
      expect(style({ numFmtId: 999 })).toEqual({});
    });

    it('looks the format up by id and ignores the xf numFmt string', () => {
      expect(style({ numFmtId: 2, numFmt: '0.000' })).toEqual({ numberFormat: '0.00' });
    });
  });

  describe('alignment', () => {
    it('reads horizontal alignment', () => {
      expect(style({ hAlign: 'center' })).toEqual({ horizontalAlignment: 'center' });
    });

    it('reads vertical alignment but omits the default "bottom"', () => {
      expect(style({ vAlign: 'top' })).toEqual({ verticalAlignment: 'top' });
      expect(style({ vAlign: 'bottom' })).toEqual({});
    });

    it('reads wrapText and shrinkToFit only when true', () => {
      expect(style({ wrapText: true, shrinkToFit: true })).toEqual({ wrapText: true, shrinkToFit: true });
      expect(style({ wrapText: false, shrinkToFit: false })).toEqual({});
    });

    it('reads textRotation but omits 0', () => {
      expect(style({ textRotation: 90 })).toEqual({ textRotation: 90 });
      expect(style({ textRotation: 255 })).toEqual({ textRotation: 255 });
      expect(style({ textRotation: 0 })).toEqual({});
    });

    it('reads pivotButton only when true', () => {
      expect(style({ pivotButton: true })).toEqual({ pivotButton: true });
      expect(style({ pivotButton: false })).toEqual({});
    });
  });

  describe('fonts', () => {
    it('reads the font family when the font has no scheme', () => {
      expect(style({ font: { name: 'Arial', size: 10 } })).toEqual({ fontFamily: 'Arial', fontSize: 10 });
    });

    it('reads the font scheme in place of the font family', () => {
      expect(style({ font: { name: 'Aptos Narrow', scheme: 'minor' } })).toEqual({ fontScheme: 'minor' });
      expect(style({ font: { name: 'Aptos Display', scheme: 'major' } })).toEqual({ fontScheme: 'major' });
    });

    it('omits the default text colour (theme dk1)', () => {
      expect(style({ font: { color: dk1 } })).toEqual({});
    });

    it('keeps theme dk1 when it has a transform', () => {
      const color: Color = { type: 'theme', value: 'dk1', transforms: [ { type: 'tint', value: 50 } ] };
      expect(style({ font: { color } })).toEqual({ color });
    });

    it('keeps other text colours', () => {
      expect(style({ font: { color: red } })).toEqual({ color: red });
      expect(style({ font: { color: { type: 'theme', value: 'dk2' } } }))
        .toEqual({ color: { type: 'theme', value: 'dk2' } });
    });

    it('reads underline', () => {
      expect(style({ font: { underline: 'single' } })).toEqual({ underline: 'single' });
      expect(style({ font: { underline: 'doubleAccounting' } })).toEqual({ underline: 'doubleAccounting' });
    });

    it('reads bold and italic only when true', () => {
      expect(style({ font: { bold: true, italic: true } })).toEqual({ bold: true, italic: true });
      expect(style({ font: { bold: false, italic: false } })).toEqual({});
    });

    it('omits font properties when the xf has no font', () => {
      expect(style({ fontId: 0 })).toEqual({});
    });
  });

  describe('fills', () => {
    it('omits a "none" fill and its colours', () => {
      expect(style({ fill: { type: 'none', fg: red, bg: blue } })).toEqual({});
    });

    it('omits a fill without a type', () => {
      expect(style({ fill: { type: '', fg: red, bg: blue } })).toEqual({});
    });

    it('uses fgColor as the fill colour of a solid fill and ignores bgColor', () => {
      expect(style({ fill: { type: 'solid', fg: red, bg: sysFg } })).toEqual({ fillColor: red });
      expect(style({ fill: { type: 'solid', fg: red, bg: blue } })).toEqual({ fillColor: red });
    });

    it('omits the fill colour of a solid fill without fgColor', () => {
      expect(style({ fill: { type: 'solid', bg: blue } })).toEqual({});
    });

    it('maps a pattern fill bgColor to fillColor and fgColor to patternColor', () => {
      expect(style({ fill: { type: 'lightGrid', fg: blue, bg: red } })).toEqual({
        fillColor: red,
        patternColor: blue,
        patternStyle: 'lightGrid',
      });
    });

    it('keeps an automatic bgColor on a pattern fill', () => {
      expect(style({ fill: { type: 'lightGrid', fg: blue, bg: { type: 'auto' } } })).toEqual({
        fillColor: { type: 'auto' },
        patternColor: blue,
        patternStyle: 'lightGrid',
      });
    });

    it('reads a pattern fill without colours', () => {
      expect(style({ fill: { type: 'gray125' } })).toEqual({ patternStyle: 'gray125' });
    });

    it('reads a pattern fill with only one colour', () => {
      expect(style({ fill: { type: 'darkUp', fg: blue } })).toEqual({
        patternColor: blue,
        patternStyle: 'darkUp',
      });
      expect(style({ fill: { type: 'darkUp', bg: red } })).toEqual({
        fillColor: red,
        patternStyle: 'darkUp',
      });
    });
  });

  describe('borders', () => {
    it('reads the style and colour of each side', () => {
      expect(style({
        border: {
          top: { style: 'thin', color: red },
          bottom: { style: 'double', color: blue },
          left: { style: 'dashed', color: red },
          right: { style: 'thick', color: blue },
          diagonalUp: undefined,
          diagonalDown: undefined,
        },
      })).toEqual({
        borderTopStyle: 'thin',
        borderTopColor: red,
        borderBottomStyle: 'double',
        borderBottomColor: blue,
        borderLeftStyle: 'dashed',
        borderLeftColor: red,
        borderRightStyle: 'thick',
        borderRightColor: blue,
      });
    });

    it('omits the default border colour (indexed 64)', () => {
      expect(style({
        border: {
          top: { style: 'thin', color: sysFg },
          bottom: undefined,
          left: undefined,
          right: undefined,
          diagonalUp: undefined,
          diagonalDown: undefined,
        },
      })).toEqual({ borderTopStyle: 'thin' });
    });

    it('omits sides that are not set', () => {
      expect(style({
        border: {
          top: undefined,
          bottom: { style: 'thin' },
          left: undefined,
          right: undefined,
          diagonalUp: undefined,
          diagonalDown: undefined,
        },
      })).toEqual({ borderBottomStyle: 'thin' });
    });

    it('ignores diagonal borders', () => {
      expect(style({
        border: {
          top: undefined,
          bottom: undefined,
          left: undefined,
          right: undefined,
          diagonalUp: { style: 'thin', color: red },
          diagonalDown: { style: 'thin', color: red },
        },
      })).toEqual({});
    });
  });

  describe('named styles', () => {
    it('converts each cell style from its cellStyleXfs entry', () => {
      const { namedStyles } = convertStyles(defs({
        cellStyleXfs: [ { font: { name: 'Arial', size: 11 } }, { font: { bold: true } } ],
        cellStyles: [
          { name: 'Normal', xfId: 0, builtinId: 0 },
          { name: 'Heading', xfId: 1 },
        ],
      }));
      expect(namedStyles).toEqual({
        Normal: { name: 'Normal', builtinId: 0, fontFamily: 'Arial', fontSize: 11 },
        Heading: { name: 'Heading', bold: true },
      });
    });

    it('keeps builtinId 0', () => {
      const { namedStyles } = convertStyles(defs({
        cellStyleXfs: [ {} ],
        cellStyles: [ { name: 'Normal', xfId: 0, builtinId: 0 } ],
      }));
      expect(namedStyles.Normal.builtinId).toBe(0);
    });

    it('uses the last entry when two cell styles have the same name', () => {
      const { namedStyles } = convertStyles(defs({
        cellStyleXfs: [ { hAlign: 'left' }, { hAlign: 'right' } ],
        cellStyles: [
          { name: 'Custom', xfId: 0 },
          { name: 'Custom', xfId: 1 },
        ],
      }));
      expect(namedStyles).toEqual({
        Custom: { name: 'Custom', horizontalAlignment: 'right' },
      });
    });
  });

  describe('extendsStyle', () => {
    const cellStyleXfs: Xf[] = [ {}, { font: { bold: true } } ];
    const cellStyles = [
      { name: 'Normal', xfId: 0, builtinId: 0 },
      { name: 'Heading', xfId: 1 },
    ];

    it('links a cell xf to the named style of its xfId', () => {
      const { styles } = convertStyles(defs({
        cellStyleXfs,
        cellStyles,
        cellXf: [ { xfId: 1, hAlign: 'center' } ],
      }));
      expect(styles).toEqual([ { horizontalAlignment: 'center', extendsStyle: 'Heading' } ]);
    });

    it('does not copy named style properties into the cell style', () => {
      const { styles } = convertStyles(defs({
        cellStyleXfs,
        cellStyles,
        cellXf: [ { xfId: 1 } ],
      }));
      expect(styles).toEqual([ { extendsStyle: 'Heading' } ]);
    });

    it('does not link to the Normal style', () => {
      const { styles } = convertStyles(defs({
        cellStyleXfs,
        cellStyles,
        cellXf: [ { xfId: 0 } ],
      }));
      expect(styles).toEqual([ {} ]);
    });

    it('does not link when the xfId has no named style', () => {
      const { styles } = convertStyles(defs({
        cellStyleXfs: [ ...cellStyleXfs, {} ],
        cellStyles,
        cellXf: [ { xfId: 2 }, {} ],
      }));
      expect(styles).toEqual([ {}, {} ]);
    });

    it('links to the last named style when two share an xfId', () => {
      const { styles } = convertStyles(defs({
        cellStyleXfs,
        cellStyles: [
          ...cellStyles,
          { name: 'Heading 2', xfId: 1 },
        ],
        cellXf: [ { xfId: 1 } ],
      }));
      expect(styles).toEqual([ { extendsStyle: 'Heading 2' } ]);
    });
  });
});
