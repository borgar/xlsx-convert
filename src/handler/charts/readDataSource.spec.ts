import { describe, it, expect } from 'vitest';
import { parseXML } from '@borgar/simple-xml';
import { readDataSource } from './readDataSource.ts';

function parse (xml: string) {
  const dom = parseXML(xml);
  return readDataSource(dom.children[0]!);
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

  it('returns undefined for an empty source', () => {
    expect(parse('<cat></cat>')).toBeUndefined();
  });
});
