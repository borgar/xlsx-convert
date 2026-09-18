import { describe, it, expect } from 'vitest';
import { parseXML } from '@borgar/simple-xml';
import { readPlotArea } from './readPlotArea.ts';
import { ConversionContext } from '../../ConversionContext.ts';

function parsePlots (plotsXml: string) {
  const dom = parseXML('<plotArea>' + plotsXml + '</plotArea>');
  const ctx = new ConversionContext();
  return readPlotArea(dom.children[0]!, ctx)?.plots ?? [];
}

const BAR_SER =
  '<ser><idx val="0"/><order val="0"/>' +
  '<val><numRef><f>S!$A$1:$A$3</f></numRef></val></ser>';

describe('readPlotArea varyColors', () => {
  it('defaults an absent varyColors to TRUE for bar charts', () => {
    // The val attribute defaults to 1 and Excel applies that to the omitted element: plain
    // single-series bars from Google Sheets AND openpyxl (no varyColors, no dPts) both render
    // vary-by-point in Excel with category legends. Excel-authored files write val="0"
    // explicitly when colours don't vary.
    const [ plot ] = parsePlots('<barChart><barDir val="col"/>' + BAR_SER + '</barChart>');
    expect(plot).toMatchObject({ type: 'bar', varyColors: true });
  });

  it('keeps an explicit varyColors=0', () => {
    const [ plot ] = parsePlots(
      '<barChart><barDir val="col"/><varyColors val="0"/>' + BAR_SER + '</barChart>',
    );
    expect(plot).toMatchObject({ type: 'bar', varyColors: false });
  });

  it('a bare varyColors element reads as true (val attribute default)', () => {
    const [ plot ] = parsePlots(
      '<barChart><barDir val="col"/><varyColors/>' + BAR_SER + '</barChart>',
    );
    expect(plot).toMatchObject({ type: 'bar', varyColors: true });
  });

  it('defaults an absent varyColors to TRUE for pie charts', () => {
    const [ plot ] = parsePlots('<pieChart>' + BAR_SER + '</pieChart>');
    expect(plot).toMatchObject({ type: 'pie', varyColors: true });
  });

  it('keeps the FALSE default for line charts (unevidenced types stay conservative)', () => {
    const [ plot ] = parsePlots('<lineChart><grouping val="standard"/>' + BAR_SER + '</lineChart>');
    expect(plot).toMatchObject({ type: 'line', varyColors: false });
  });
});
