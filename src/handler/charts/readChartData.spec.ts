import { describe, it, expect } from 'vitest';
import { parseXML } from '@borgar/simple-xml';
import { ConversionContext } from '../../ConversionContext.ts';
import { readChartData } from './readChartData.ts';

const NS = 'xmlns:cx="http://schemas.microsoft.com/office/drawing/2014/chartex"';

function parse (dataXml: string, names: Record<string, string> = {}) {
  const context = new ConversionContext();
  for (const [ name, value ] of Object.entries(names)) {
    context.nameDefs.set(name, { name, value });
  }
  return readChartData(parseXML(`<cx:chartData ${NS}>${dataXml}</cx:chartData>`).root!, context);
}

describe('readChartData', () => {
  it('resolves the defined names that ChartEx uses for data references', () => {
    const map = parse(
      '<cx:data id="0"><cx:strDim type="cat"><cx:f>_xlchart.v1.0</cx:f></cx:strDim>' +
      '<cx:numDim type="val"><cx:f>_xlchart.v1.2</cx:f></cx:numDim></cx:data>',
      { '_xlchart.v1.0': 'Sheet1!$A$2:$A$6', '_xlchart.v1.2': 'Sheet1!$B$2:$B$6' },
    );
    expect(map.get(0)).toEqual({
      cat: { numeric: false, f: 'Sheet1!$A$2:$A$6' },
      val: { numeric: true, f: 'Sheet1!$B$2:$B$6' },
    });
  });

  it('keeps every dimension type, and the formula direction', () => {
    const map = parse(
      '<cx:data id="3"><cx:strDim type="cat"><cx:f dir="row">Sheet1!$A$1:$E$2</cx:f></cx:strDim>' +
      '<cx:numDim type="size"><cx:f>Sheet1!$A$3:$E$3</cx:f></cx:numDim></cx:data>',
    );
    expect(map.get(3)?.cat).toEqual({ numeric: false, f: 'Sheet1!$A$1:$E$2', dir: 'row' });
    expect(map.get(3)?.size).toEqual({ numeric: true, f: 'Sheet1!$A$3:$E$3' });
  });

  it('ignores the cache when there is a formula, but counts the levels', () => {
    const map = parse(
      '<cx:data id="0"><cx:strDim type="cat"><cx:f>Sheet1!$A$2:$B$4</cx:f>' +
      '<cx:lvl ptCount="3"><cx:pt idx="0">Q1</cx:pt><cx:pt idx="1">Q2</cx:pt></cx:lvl>' +
      '<cx:lvl ptCount="3"><cx:pt idx="0">2024</cx:pt></cx:lvl></cx:strDim></cx:data>',
    );
    expect(map.get(0)?.cat).toEqual({ numeric: false, f: 'Sheet1!$A$2:$B$4', levels: 2 });
  });

  it('reads literal data when there is no formula', () => {
    const map = parse(
      '<cx:data id="0"><cx:numDim type="val"><cx:lvl ptCount="3" formatCode="0.0">' +
      '<cx:pt idx="0">1.5</cx:pt><cx:pt idx="2">3</cx:pt></cx:lvl></cx:numDim></cx:data>',
    );
    expect(map.get(0)?.val).toEqual({ numeric: true, formatCode: '0.0', values: [ '1.5', null, '3' ] });
  });
});
