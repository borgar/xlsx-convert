import { describe, it, expect } from 'vitest';
import { parseXML } from '@borgar/simple-xml';
import { readPivotFmts } from './readPivotFmts.ts';
import { ConversionContext } from '../../ConversionContext.ts';

function parse (xml: string) {
  const dom = parseXML(xml);
  return readPivotFmts(dom.children[0]!, new ConversionContext());
}

describe('readPivotFmts', () => {
  it('reads pivotFmt entries with their markers', () => {
    // Pivot charts persist per-series/point formatting ONLY through pivotFmts (Excel
    // regenerates <c:ser> from the pivot on load). Dropping them loses e.g. an explicit
    // "no markers" choice, and consumers restore auto markers Excel does not draw.
    const fmts = parse(
      '<pivotFmts>' +
      '<pivotFmt><idx val="0"/><marker><symbol val="none"/></marker></pivotFmt>' +
      '<pivotFmt><idx val="2"/><marker><symbol val="circle"/><size val="7"/></marker></pivotFmt>' +
      '</pivotFmts>',
    );
    expect(fmts?.pivotFmt).toHaveLength(2);
    expect(fmts?.pivotFmt?.[0]).toMatchObject({ idx: 0, marker: { symbol: 'none' } });
    expect(fmts?.pivotFmt?.[1]).toMatchObject({ idx: 2, marker: { symbol: 'circle', size: 7 } });
  });

  it('reads pivotFmt shapes', () => {
    const fmts = parse(
      '<pivotFmts><pivotFmt><idx val="1"/>' +
      '<spPr><solidFill><srgbClr val="FF0000"/></solidFill></spPr>' +
      '</pivotFmt></pivotFmts>',
    );
    expect(fmts?.pivotFmt?.[0]?.idx).toBe(1);
    expect(fmts?.pivotFmt?.[0]?.shape?.fill).toBeTruthy();
  });

  it('returns undefined for an empty element', () => {
    expect(parse('<pivotFmts></pivotFmts>')).toBeUndefined();
  });
});
