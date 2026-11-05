import { describe, it, expect } from 'vitest';
import { parseXML } from '@borgar/simple-xml';
import { readSeries } from './readSeries.ts';
import { ConversionContext } from '../../ConversionContext.ts';

describe('readSeries', () => {
  it('decodes _xHHHH_ escapes in a literal series name', () => {
    const series = readSeries(
      parseXML('<ser><idx val="0"/><order val="0"/><tx><v>S_x0041__x005F_x0042_</v></tx></ser>').children[0]!,
      new ConversionContext(),
    );
    expect(series?.text).toBe('SA_x0042_');
  });
});
