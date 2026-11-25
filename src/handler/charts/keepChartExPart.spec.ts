import { describe, it, expect } from 'vitest';
import { ConversionContext } from '../../ConversionContext.ts';
import { rewriteChartExFormulas } from './keepChartExPart.ts';

function contextWithNames (names: Record<string, string>) {
  const context = new ConversionContext();
  for (const [ name, value ] of Object.entries(names)) {
    context.definedNames.push({ name, value });
  }
  return context;
}

describe('rewriteChartExFormulas', () => {
  it('replaces Excel\'s hidden chart names with the ranges they stand for', () => {
    const context = contextWithNames({ '_xlchart.v5.0': 'Map!$A$2:$A$6', '_xlchart.v5.1': '\'A & B\'!$B$1' });
    const xml = '<cx:numDim type="val"><cx:f dir="row">_xlchart.v5.0</cx:f></cx:numDim><cx:f>_xlchart.v5.1</cx:f>';
    expect(rewriteChartExFormulas(xml, context)).toBe(
      '<cx:numDim type="val"><cx:f dir="row">Map!$A$2:$A$6</cx:f></cx:numDim><cx:f>\'A &amp; B\'!$B$1</cx:f>',
    );
  });

  it('leaves other formulas and the rest of the part as they are', () => {
    const context = contextWithNames({});
    const xml = '<cx:fmtOvr idx="0"/><cx:f>Sheet1!$A$1</cx:f><cx:geoCache provider="{x}">…</cx:geoCache>';
    expect(rewriteChartExFormulas(xml, context)).toBe(xml);
  });
});
