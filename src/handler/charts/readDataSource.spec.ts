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
