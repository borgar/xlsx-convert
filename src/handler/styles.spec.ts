import { parseXML } from '@borgar/simple-xml';
import { THEMES } from '@jsfkit/utils';
import { describe, expect, it } from 'vitest';

import { ConversionContext } from '../ConversionContext.ts';
import { handlerStyles, readDxf } from './styles.ts';

function dxf (body: string) {
  const dom = parseXML(
    '<dxf xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' + body + '</dxf>',
  );
  return readDxf(dom.root!, THEMES.default);
}

function fills (...patternFills: string[]) {
  const dom = parseXML(
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fills>' +
    patternFills.map(f => '<fill>' + f + '</fill>').join('') +
    '</fills></styleSheet>',
  );
  return handlerStyles(dom, new ConversionContext()).fill;
}

describe('handlerStyles fills', () => {
  it('defaults a missing patternType to "none"', () => {
    expect(fills('<patternFill/>')).toEqual([ { type: 'none' } ]);
  });

  it('reads patternType as-is', () => {
    expect(fills(
      '<patternFill patternType="none"/>',
      '<patternFill patternType="gray125"/>',
      '<patternFill patternType="solid"/>',
      '<patternFill patternType="lightGrid"/>',
    ).map(f => f.type)).toEqual([ 'none', 'gray125', 'solid', 'lightGrid' ]);
  });

  it('keeps fgColor and bgColor as written for a solid fill', () => {
    // The solid fill colour is in fgColor; bgColor is usually the system colour indexed=64.
    expect(fills(
      '<patternFill patternType="solid"><fgColor rgb="FFFFABAD"/><bgColor indexed="64"/></patternFill>',
    )).toEqual([ {
      type: 'solid',
      fg: { type: 'srgb', value: 'FFABAD' },
      bg: { type: 'indexed', value: 64 },
    } ]);
  });

  it('reads fgColor and bgColor for a pattern fill', () => {
    expect(fills(
      '<patternFill patternType="lightGrid"><fgColor rgb="FF01007F"/><bgColor rgb="FFFFABAD"/></patternFill>',
    )).toEqual([ {
      type: 'lightGrid',
      fg: { type: 'srgb', value: '01007F' },
      bg: { type: 'srgb', value: 'FFABAD' },
    } ]);
  });

  it('reads an automatic colour', () => {
    expect(fills(
      '<patternFill patternType="lightGrid"><fgColor rgb="FF01007F"/><bgColor auto="1"/></patternFill>',
    )).toEqual([ {
      type: 'lightGrid',
      fg: { type: 'srgb', value: '01007F' },
      bg: { type: 'auto' },
    } ]);
  });

  it('reads theme colours with tint', () => {
    expect(fills(
      '<patternFill patternType="darkUp"><fgColor theme="4" tint="0.4"/><bgColor theme="1" tint="-0.25"/></patternFill>',
    )).toEqual([ {
      type: 'darkUp',
      fg: { type: 'theme', value: 'accent1', transforms: [ { type: 'tint', value: 60 } ] },
      bg: { type: 'theme', value: 'dk1', transforms: [ { type: 'shade', value: 75 } ] },
    } ]);
  });

  it('omits colours that are not present', () => {
    expect(fills(
      '<patternFill patternType="solid"><fgColor rgb="FFFF0000"/></patternFill>',
      '<patternFill patternType="gray125"><bgColor rgb="FF00FF00"/></patternFill>',
    )).toEqual([
      { type: 'solid', fg: { type: 'srgb', value: 'FF0000' } },
      { type: 'gray125', bg: { type: 'srgb', value: '00FF00' } },
    ]);
  });

  it('keeps colours on a "none" fill', () => {
    expect(fills(
      '<patternFill patternType="none"><fgColor rgb="FFFF0000"/><bgColor indexed="64"/></patternFill>',
    )).toEqual([ {
      type: 'none',
      fg: { type: 'srgb', value: 'FF0000' },
      bg: { type: 'indexed', value: 64 },
    } ]);
  });
});

describe('readDxf', () => {
  it('reads a solid fill from bgColor', () => {
    expect(dxf('<fill><patternFill><bgColor rgb="FFFF0000"/></patternFill></fill>')).toEqual({
      fillColor: { type: 'srgb', value: 'FF0000' },
    });
  });

  it('defaults a missing patternType to "solid"', () => {
    // Unlike cell fills, where a missing patternType means "none".
    expect(dxf('<fill><patternFill><fgColor rgb="FFFF0000"/></patternFill></fill>')).toEqual({
      fillColor: { type: 'srgb', value: 'FF0000' },
    });
  });

  it('prefers bgColor over fgColor for a solid fill', () => {
    // Unlike cell fills, where a solid fill uses fgColor.
    const fill = '<fgColor rgb="FF0000FF"/><bgColor rgb="FFFF0000"/>';
    expect(dxf('<fill><patternFill>' + fill + '</patternFill></fill>')).toEqual({
      fillColor: { type: 'srgb', value: 'FF0000' },
    });
    expect(dxf('<fill><patternFill patternType="solid">' + fill + '</patternFill></fill>')).toEqual({
      fillColor: { type: 'srgb', value: 'FF0000' },
    });
  });

  it('falls back to fgColor for an explicit solid fill without bgColor', () => {
    expect(dxf('<fill><patternFill patternType="solid"><fgColor theme="4"/></patternFill></fill>')).toEqual({
      fillColor: { type: 'theme', value: 'accent1' },
    });
  });

  it('reads a pattern fill with bgColor as fill and fgColor as pattern colour', () => {
    expect(dxf(
      '<fill><patternFill patternType="lightGrid"><fgColor rgb="FF01007F"/><bgColor rgb="FFFFABAD"/></patternFill></fill>',
    )).toEqual({
      fillColor: { type: 'srgb', value: 'FFABAD' },
      patternColor: { type: 'srgb', value: '01007F' },
      patternStyle: 'lightGrid',
    });
  });

  it('reads a pattern fill with only one colour', () => {
    expect(dxf('<fill><patternFill patternType="gray125"><fgColor rgb="FF01007F"/></patternFill></fill>')).toEqual({
      patternColor: { type: 'srgb', value: '01007F' },
      patternStyle: 'gray125',
    });
    expect(dxf('<fill><patternFill patternType="gray125"><bgColor rgb="FFFFABAD"/></patternFill></fill>')).toEqual({
      fillColor: { type: 'srgb', value: 'FFABAD' },
      patternStyle: 'gray125',
    });
  });

  it('reads an automatic colour in a pattern fill', () => {
    expect(dxf('<fill><patternFill patternType="lightGrid"><bgColor auto="1"/></patternFill></fill>')).toEqual({
      fillColor: { type: 'auto' },
      patternStyle: 'lightGrid',
    });
  });

  it('ignores colours on an explicit "none" fill', () => {
    expect(dxf(
      '<fill><patternFill patternType="none"><fgColor rgb="FFFF0000"/><bgColor rgb="FF00FF00"/></patternFill></fill>',
    )).toEqual({
      patternStyle: 'none',
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
