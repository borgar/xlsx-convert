import { parseXML } from '@borgar/simple-xml';
import { THEMES } from '@jsfkit/utils';
import { describe, expect, it } from 'vitest';

import { readDxf } from './styles.ts';

function dxf (body: string) {
  const dom = parseXML(
    '<dxf xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' + body + '</dxf>',
  );
  return readDxf(dom.root!, THEMES.default);
}

describe('readDxf', () => {
  it('reads a solid fill from bgColor', () => {
    expect(dxf('<fill><patternFill><bgColor rgb="FFFF0000"/></patternFill></fill>')).toEqual({
      fillColor: { type: 'srgb', value: 'FF0000' },
    });
  });

  it('keeps an explicit "none" fill so the cell fill is cleared', () => {
    expect(dxf('<fill><patternFill patternType="none"/></fill>')).toEqual({
      patternStyle: 'none',
    });
    expect(dxf('<fill><patternFill patternType="none"><bgColor auto="1"/></patternFill></fill>')).toEqual({
      patternStyle: 'none',
    });
  });

  it('reads a border side with a style and colour', () => {
    expect(dxf('<border><left style="thin"><color rgb="FF000000"/></left></border>')).toEqual({
      borderLeftStyle: 'thin',
      borderLeftColor: { type: 'srgb', value: '000000' },
    });
  });

  it('reads a border side without a style as "none" and omits absent sides', () => {
    expect(dxf('<border><left/><top style="none"/></border>')).toEqual({
      borderLeftStyle: 'none',
      borderTopStyle: 'none',
    });
  });

  it('maps start and end sides to left and right', () => {
    expect(dxf('<border><start style="thin"/><end style="double"/></border>')).toEqual({
      borderLeftStyle: 'thin',
      borderRightStyle: 'double',
    });
  });
});
