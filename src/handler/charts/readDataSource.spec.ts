import { describe, it, expect } from 'vitest';
import { parseXML } from '@borgar/simple-xml';
import type { External } from '@jsfkit/types';
import { readDataSource } from './readDataSource.ts';
import { ConversionContext } from '../../ConversionContext.ts';

function externalLink (name: string): External {
  return { name, sheets: [], names: [] };
}

function parse (xml: string, externalLinks: External[] = []) {
  const dom = parseXML(xml);
  const ctx = new ConversionContext();
  ctx.externalLinks = externalLinks;
  return readDataSource(dom.children[0]!, ctx);
}

describe('readDataSource', () => {
  it('reads a numRef', () => {
    const data = parse('<val><numRef><f>Sheet1!$C$2:$C$14</f></numRef></val>');
    expect(data).toEqual({ type: 'numRef', f: 'Sheet1!$C$2:$C$14' });
  });

  it('reads a strRef', () => {
    const data = parse('<cat><strRef><f>Sheet1!$A$2:$A$14</f></strRef></cat>');
    expect(data).toEqual({ type: 'strRef', f: 'Sheet1!$A$2:$A$14' });
  });

  it('reads the whole range of a reference with filtered categories (c15:fullRef)', () => {
    // Excel writes the extension before c:f, out of schema order
    const fullRef = (range: string) => (
      '<extLst><ext uri="{02D57815-91ED-43cb-92C2-25804820EDAC}">' +
      `<fullRef><sqref>${range}</sqref></fullRef></ext></extLst>`
    );
    expect(parse(`<val><numRef>${fullRef('Sheet1!$B$2:$B$4')}<f>(Sheet1!$B$2,Sheet1!$B$4)</f></numRef></val>`))
      .toEqual({ type: 'numRef', f: '(Sheet1!$B$2,Sheet1!$B$4)', fullRef: 'Sheet1!$B$2:$B$4' });
    expect(parse(`<cat><strRef><f>(Sheet1!$A$2,Sheet1!$A$4)</f>${fullRef('Sheet1!$A$2:$A$4')}</strRef></cat>`))
      .toEqual({ type: 'strRef', f: '(Sheet1!$A$2,Sheet1!$A$4)', fullRef: 'Sheet1!$A$2:$A$4' });
    expect(parse(`<cat><multiLvlStrRef>${fullRef('Sheet1!$A$2:$B$4')}<f>(Sheet1!$A$2:$B$2,Sheet1!$A$4:$B$4)</f></multiLvlStrRef></cat>`))
      .toEqual({ type: 'mlStrRef', f: '(Sheet1!$A$2:$B$2,Sheet1!$A$4:$B$4)', fullRef: 'Sheet1!$A$2:$B$4' });
  });

  it('reads the range of a series filtered out of the chart (c15:formulaRef), which has no c:f', () => {
    const data = parse(
      '<val><numRef><extLst><ext uri="{02D57815-91ED-43cb-92C2-25804820EDAC}">' +
      '<formulaRef><sqref>Sheet1!$C$2:$C$4</sqref></formulaRef></ext></extLst></numRef></val>',
    );
    expect(data).toEqual({ type: 'numRef', f: '', fullRef: 'Sheet1!$C$2:$C$4' });
  });

  it('reads a multiLvlStrRef', () => {
    // Multi-level (grouped) category references span several columns; dropping them loses the
    // series' category/x data entirely (a scatter xVal that reads as undefined renders an empty
    // chart downstream).
    const data = parse(
      '<xVal><multiLvlStrRef><f>Before!$A$2:$B$14</f>' +
      '<multiLvlStrCache><ptCount val="13"/></multiLvlStrCache>' +
      '</multiLvlStrRef></xVal>',
    );
    expect(data).toEqual({ type: 'mlStrRef', f: 'Before!$A$2:$B$14' });
  });

  it('ignores caches, because chart data is evaluated from the formula', () => {
    const data = parse(
      '<val><numRef><f>Sheet1!$B$2:$B$3</f><numCache><formatCode>General</formatCode>' +
      '<ptCount val="2"/><pt idx="0"><v>1.5</v></pt></numCache></numRef></val>',
    );
    expect(data).toEqual({ type: 'numRef', f: 'Sheet1!$B$2:$B$3' });
  });

  it('reads literal data, including per-point format codes', () => {
    expect(parse(
      '<val><numLit><formatCode>General</formatCode><ptCount val="2"/>' +
      '<pt idx="0"><v>7</v></pt><pt idx="1" formatCode="0%"><v>0.5</v></pt></numLit></val>',
    )).toEqual({
      type: 'numData',
      formatCode: 'General',
      ptCount: 2,
      pt: [ { idx: 0, v: '7' }, { idx: 1, v: '0.5', formatCode: '0%' } ],
    });
    expect(parse('<cat><strLit><ptCount val="1"/><pt idx="0"><v>A</v></pt></strLit></cat>'))
      .toEqual({ type: 'strData', ptCount: 1, pt: [ { idx: 0, v: 'A' } ] });
  });

  // XLSX writes an external workbook as a 1-based index into the workbook's external links
  // (`[1]Sheet1!A1`). JSF carries the filename instead, so a consumer can resolve the reference
  // without also holding on to the link table.
  it('expands an external index into a workbook name in a numRef', () => {
    const data = parse(
      '<val><numRef><f>[1]Sheet1!$C$2:$C$14</f></numRef></val>',
      [ externalLink('other.xlsx') ],
    );
    expect(data).toEqual({ type: 'numRef', f: '[other.xlsx]Sheet1!$C$2:$C$14' });
  });

  it('expands an external index into a workbook name in a strRef', () => {
    // The index is 1-based, so [2] is the second link.
    const data = parse(
      '<cat><strRef><f>[2]Sheet1!$A$2:$A$14</f></strRef></cat>',
      [ externalLink('first.xlsx'), externalLink('other.xlsx') ],
    );
    expect(data).toEqual({ type: 'strRef', f: '[other.xlsx]Sheet1!$A$2:$A$14' });
  });

  it('expands an external index into a workbook name in a multiLvlStrRef', () => {
    const data = parse(
      '<xVal><multiLvlStrRef><f>[1]Before!$A$2:$B$14</f>' +
      '<multiLvlStrCache><ptCount val="13"/></multiLvlStrCache>' +
      '</multiLvlStrRef></xVal>',
      [ externalLink('other.xlsx') ],
    );
    expect(data).toEqual({ type: 'mlStrRef', f: '[other.xlsx]Before!$A$2:$B$14' });
  });

  it('reads an external index with no matching link as #REF!', () => {
    const data = parse('<val><numRef><f>[1]Sheet1!$C$2:$C$14</f></numRef></val>');
    expect(data).toEqual({ type: 'numRef', f: '#REF!' });
  });

  it('returns undefined for an empty source', () => {
    expect(parse('<cat></cat>')).toBeUndefined();
  });
});
