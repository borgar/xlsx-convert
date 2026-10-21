import type { ChartPlot } from '@jsfkit/types';
import { describe, it, expect } from 'vitest';
import { parseXML } from '@borgar/simple-xml';
import { ConversionContext } from '../../ConversionContext.ts';
import { handlerChart } from '../chart.ts';
import { convertChartSpace } from './convertChartSpace.ts';
import { dropDefaultSeriesOrder } from './convertShared.ts';

const NS = [
  'xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"',
  'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"',
  'xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"',
  'xmlns:c14="http://schemas.microsoft.com/office/drawing/2007/8/2/chart"',
  'xmlns:c15="http://schemas.microsoft.com/office/drawing/2012/chart"',
  'xmlns:c16r3="http://schemas.microsoft.com/office/drawing/2017/03/chart"',
].join(' ');

function series (idx: number, col: string, extra = '') {
  return `<c:ser><c:idx val="${idx}"/><c:order val="${idx}"/>` +
    `<c:tx><c:strRef><c:f>Sheet1!$${col}$1</c:f></c:strRef></c:tx>` +
    '<c:cat><c:strRef><c:f>Sheet1!$A$2:$A$4</c:f></c:strRef></c:cat>' +
    `<c:val><c:numRef><c:f>Sheet1!$${col}$2:$${col}$4</c:f></c:numRef></c:val>` +
    extra + '</c:ser>';
}

function convert (plotContent: string, chartExtra = '', spaceExtra = '') {
  const xml = `<c:chartSpace ${NS}>${spaceExtra}<c:chart><c:plotArea><c:layout/>` +
    `<c:lineChart><c:grouping val="standard"/><c:varyColors val="0"/>${plotContent}` +
    '<c:axId val="10"/><c:axId val="20"/></c:lineChart>' +
    '<c:catAx><c:axId val="10"/><c:axPos val="b"/><c:crossAx val="20"/><c:crosses val="autoZero"/></c:catAx>' +
    '<c:valAx><c:axId val="20"/><c:axPos val="l"/><c:crossAx val="10"/><c:crosses val="autoZero"/>' +
    '<c:crossBetween val="between"/></c:valAx>' +
    `</c:plotArea>${chartExtra}</c:chart></c:chartSpace>`;
  const context = new ConversionContext();
  return convertChartSpace(handlerChart(parseXML(xml), context), context)!;
}

describe('convertChartSpace', () => {
  it('names the crossed axis only when it isn\'t the plot\'s default', () => {
    const xml = `<c:chartSpace ${NS}><c:chart><c:plotArea><c:layout/>` +
      `<c:lineChart><c:grouping val="standard"/><c:varyColors val="0"/>${series(0, 'B')}` +
      '<c:axId val="10"/><c:axId val="20"/></c:lineChart>' +
      '<c:catAx><c:axId val="10"/><c:axPos val="b"/><c:crossAx val="30"/><c:crosses val="max"/></c:catAx>' +
      '<c:valAx><c:axId val="20"/><c:axPos val="l"/><c:crossAx val="10"/><c:crosses val="autoZero"/></c:valAx>' +
      '<c:valAx><c:axId val="30"/><c:axPos val="r"/><c:crossAx val="10"/><c:crosses val="autoZero"/></c:valAx>' +
      '</c:plotArea></c:chart></c:chartSpace>';
    const context = new ConversionContext();
    const chart = convertChartSpace(handlerChart(parseXML(xml), context), context)!;
    expect(chart.axes?.map(a => [ a.id, a.crosses ])).toEqual([
      [ 'categoryAxis', { type: 'max', axis: 'value2Axis' } ],
      [ 'valueAxis', undefined ],
      [ 'value2Axis', { type: 'auto', axis: 'categoryAxis' } ],
    ]);
  });

  it('reads gap width and overlap written as percentages', () => {
    const xml = `<c:chartSpace ${NS}><c:chart><c:plotArea><c:layout/>` +
      `<c:barChart><c:barDir val="col"/><c:grouping val="clustered"/>${series(0, 'B')}` +
      '<c:gapWidth val="50%"/><c:overlap val="-20%"/><c:axId val="10"/><c:axId val="20"/></c:barChart>' +
      '<c:catAx><c:axId val="10"/><c:axPos val="b"/><c:crossAx val="20"/></c:catAx>' +
      '<c:valAx><c:axId val="20"/><c:axPos val="l"/><c:crossAx val="10"/></c:valAx>' +
      '</c:plotArea></c:chart></c:chartSpace>';
    const context = new ConversionContext();
    const chart = convertChartSpace(handlerChart(parseXML(xml), context), context)!;
    expect(chart.plots[0].layout).toEqual({ type: 'bar', gapWidth: 50, overlap: -20 });
  });

  it('keeps a 3D bar series\' shape only when it differs from the plot\'s', () => {
    const xml = `<c:chartSpace ${NS}><c:chart><c:view3D/><c:plotArea><c:layout/>` +
      `<c:bar3DChart><c:barDir val="col"/><c:grouping val="clustered"/>${series(0, 'B', '<c:shape val="cylinder"/>')}` +
      `${series(1, 'C', '<c:shape val="box"/>')}<c:shape val="box"/><c:axId val="10"/><c:axId val="20"/><c:axId val="0"/></c:bar3DChart>` +
      '<c:catAx><c:axId val="10"/><c:axPos val="b"/><c:crossAx val="20"/></c:catAx>' +
      '<c:valAx><c:axId val="20"/><c:axPos val="l"/><c:crossAx val="10"/></c:valAx>' +
      '</c:plotArea></c:chart></c:chartSpace>';
    const context = new ConversionContext();
    const chart = convertChartSpace(handlerChart(parseXML(xml), context), context)!;
    expect(chart.plots[0].series.map(s => s.barShape)).toEqual([ 'cylinder', undefined ]);
  });

  it('keeps an axis whose ID is 0', () => {
    const xml = `<c:chartSpace ${NS}><c:chart><c:plotArea><c:layout/>` +
      `<c:lineChart><c:grouping val="standard"/><c:varyColors val="0"/>${series(0, 'B')}` +
      '<c:axId val="0"/><c:axId val="1"/></c:lineChart>' +
      '<c:catAx><c:axId val="0"/><c:axPos val="b"/><c:crossAx val="1"/></c:catAx>' +
      '<c:valAx><c:axId val="1"/><c:axPos val="l"/><c:crossAx val="0"/></c:valAx>' +
      '</c:plotArea></c:chart></c:chartSpace>';
    const context = new ConversionContext();
    const chart = convertChartSpace(handlerChart(parseXML(xml), context), context)!;
    expect(chart.axes?.map(a => a.id)).toEqual([ 'categoryAxis', 'valueAxis' ]);
  });

  it('keeps the display units label of a built-in unit', () => {
    const xml = `<c:chartSpace ${NS}><c:chart><c:plotArea><c:layout/>` +
      `<c:lineChart><c:grouping val="standard"/><c:varyColors val="0"/>${series(0, 'B')}` +
      '<c:axId val="10"/><c:axId val="20"/></c:lineChart>' +
      '<c:catAx><c:axId val="10"/><c:axPos val="b"/><c:crossAx val="20"/></c:catAx>' +
      '<c:valAx><c:axId val="20"/><c:axPos val="l"/><c:crossAx val="10"/>' +
      '<c:dispUnits><c:builtInUnit val="thousands"/><c:dispUnitsLbl><c:layout><c:manualLayout>' +
      '<c:xMode val="edge"/><c:yMode val="edge"/><c:x val="0.1"/><c:y val="0.2"/>' +
      '</c:manualLayout></c:layout></c:dispUnitsLbl></c:dispUnits></c:valAx>' +
      '</c:plotArea></c:chart></c:chartSpace>';
    const context = new ConversionContext();
    const chart = convertChartSpace(handlerChart(parseXML(xml), context), context)!;
    const axis = chart.axes?.find(a => a.id === 'valueAxis');
    expect(axis?.displayUnits).toBe(1000);
    expect(axis?.displayUnitsLabel).toMatchObject({ layout: { x: 0.1, y: 0.2, xMode: 'edge', yMode: 'edge' } });
  });

  it('reads the chart style number from the fallback of mc:AlternateContent', () => {
    const chart = convert(series(0, 'B'), '',
      '<mc:AlternateContent><mc:Choice Requires="c14"><c14:style val="102"/></mc:Choice>' +
      '<mc:Fallback><c:style val="2"/></mc:Fallback></mc:AlternateContent>');
    expect(chart.styleId).toBe(2);
  });

  it('reads the chart style number from c14:style when there is no fallback', () => {
    const chart = convert(series(0, 'B'), '',
      '<mc:AlternateContent><mc:Choice Requires="c14"><c14:style val="107"/></mc:Choice></mc:AlternateContent>');
    expect(chart.styleId).toBe(7);
  });

  it('reads a boolean element without a val as true', () => {
    const chart = convert(series(0, 'B', '<c:smooth/>'), '', '<c:roundedCorners/>');
    expect(chart.plots[0].series[0].smooth).toBe(true);
    expect(chart.roundedCorners).toBe(true);
  });

  it('reads a data point\'s marker and invert-if-negative setting', () => {
    const dPt = '<c:dPt><c:idx val="1"/><c:invertIfNegative val="0"/>' +
      '<c:marker><c:symbol val="square"/><c:size val="9"/></c:marker></c:dPt>';
    const chart = convert(series(0, 'B', dPt));
    expect(chart.plots[0].series[0].points).toEqual([
      { index: 1, invertIfNegative: false, marker: { symbol: 'square', size: 9 } },
    ]);
  });

  it('reads vertical text and underline', () => {
    const title = '<c:title><c:tx><c:rich><a:bodyPr vert="vert270"/><a:p><a:pPr><a:defRPr u="dbl"/></a:pPr>' +
      '<a:r><a:t>Title</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title>';
    const chart = convert(series(0, 'B'), title);
    expect(chart.title?.textStyle).toMatchObject({ vert: 'vert270', underline: 'double' });
  });

  it('gives custom error amounts a binding without a role', () => {
    const errBars = '<c:errBars><c:errDir val="y"/><c:errBarType val="plus"/><c:errValType val="cust"/>' +
      '<c:plus><c:numRef><c:f>Sheet1!$C$2:$C$4</c:f></c:numRef></c:plus></c:errBars>';
    const chart = convert(series(0, 'B', errBars));
    const s = chart.plots[0].series[0];
    expect(s.bindings?.yErrorPlus).toEqual({ formula: 'Sheet1!$C$2:$C$4' });
    expect(s.bindings?.value?.role).toBe('value');
  });

  it('reports a chart without plots, or without c:chart, as not converted', () => {
    for (const body of [ '<c:chart><c:plotArea><c:layout/></c:plotArea></c:chart>', '' ]) {
      const context = new ConversionContext();
      const chart = convertChartSpace(handlerChart(parseXML(`<c:chartSpace ${NS}>${body}</c:chartSpace>`), context), context);
      expect(chart).toBeUndefined();
      expect(context.unsupported.has('chart')).toBe(true);
    }
  });

  it('overlays a title or legend without an overlay value, as Excel does', () => {
    const title = (overlay: string) => '<c:title><c:tx><c:rich><a:bodyPr/><a:p><a:r><a:t>T</a:t></a:r></a:p>' +
      `</c:rich></c:tx>${overlay}</c:title>`;
    expect(convert(series(0, 'B'), title('')).title?.overlay).toBe(true);
    expect(convert(series(0, 'B'), title('<c:overlay/>')).title?.overlay).toBe(true);
    expect(convert(series(0, 'B'), title('<c:overlay val="0"/>')).title?.overlay).toBeUndefined();
    const legend = convert(series(0, 'B'), '<c:legend><c:legendPos val="b"/></c:legend>');
    expect(legend.legend?.overlay).toBe(true);
  });

  it('reads "Show #N/A as an empty cell"', () => {
    const chart = convert(series(0, 'B'),
      '<c:extLst><c:ext uri="{56B9EC1D-385E-4148-901F-78D8002777C0}">' +
      '<c16r3:dataDisplayOptions16><c16r3:dispNaAsBlank val="1"/></c16r3:dataDisplayOptions16>' +
      '</c:ext></c:extLst>');
    expect(chart.showNaAsBlank).toBe(true);
  });

  it('keeps filtered series as hidden series, rather than as visible ones', () => {
    const chart = convert(
      series(0, 'B') +
      '<c:extLst><c:ext uri="{02D57815-91ED-43cb-92C2-25804820EDAC}"><c15:filteredLineSeries>' +
      series(1, 'C').replace(/^<c:ser>/, '<c15:ser>').replace(/<\/c:ser>$/, '</c15:ser>') +
      '</c15:filteredLineSeries></c:ext></c:extLst>',
    );
    const list = chart.plots[0].series!;
    expect(list.map(s => [ s.id, s.hidden ?? false ])).toEqual([ [ 's0', false ], [ 's1', true ] ]);
    expect(list[1].bindings?.value?.formula).toBe('Sheet1!$C$2:$C$4');
  });

  it('reads labels taken from cells ("Value From Cells")', () => {
    const chart = convert(series(0, 'B',
      '<c:dLbls><c:showLegendKey val="0"/><c:showVal val="1"/><c:showCatName val="0"/>' +
      '<c:showSerName val="0"/><c:showPercent val="0"/><c:showBubbleSize val="0"/>' +
      '<c:extLst><c:ext uri="{CE6537A1-D6FC-4f65-9D91-7224C49458BB}">' +
      '<c15:showDataLabelsRange val="1"/></c:ext></c:extLst></c:dLbls>' +
      '<c:extLst><c:ext uri="{02D57815-91ED-43cb-92C2-25804820EDAC}">' +
      '<c15:datalabelsRange><c15:f>Sheet1!$D$2:$D$4</c15:f>' +
      '<c15:dlblRangeCache><c:ptCount val="3"/></c15:dlblRangeCache></c15:datalabelsRange>' +
      '</c:ext></c:extLst>'));
    const s = chart.plots[0].series![0];
    expect(s.bindings?.label).toEqual({ formula: 'Sheet1!$D$2:$D$4', role: 'label' });
    expect(s.encoding).toEqual({ text: { field: 'label' } });
    expect(s.labels?.show).toEqual([ 'value', 'cellRange' ]);
  });

  it('reads trendline labels', () => {
    const chart = convert(series(0, 'B',
      '<c:trendline><c:trendlineType val="linear"/><c:dispRSqr val="1"/><c:dispEq val="1"/>' +
      '<c:trendlineLbl><c:layout><c:manualLayout><c:x val="0.1"/><c:y val="-0.05"/></c:manualLayout></c:layout>' +
      '<c:numFmt formatCode="0.00" sourceLinked="0"/></c:trendlineLbl></c:trendline>'));
    const trendline = chart.plots[0].series![0].trendlines![0];
    expect(trendline).toMatchObject({
      type: 'linear',
      displayRSquared: true,
      displayEquation: true,
      label: { layout: { x: 0.1, y: -0.05 }, numberFormat: '0.00', sourceLinked: false },
    });
  });

  it('puts a legend with a manual layout and no position on the right', () => {
    const layout = '<c:layout><c:manualLayout><c:xMode val="edge"/><c:yMode val="edge"/>' +
      '<c:x val="0.7"/><c:y val="0.1"/></c:manualLayout></c:layout>';
    const moved = convert(series(0, 'B'), `<c:legend>${layout}<c:overlay val="1"/></c:legend>`);
    expect(moved.legend).toMatchObject({ overlay: true, layout: { x: 0.7, y: 0.1, xMode: 'edge', yMode: 'edge' } });
    expect(moved.legend?.position).toBeUndefined();
  });

  it('keeps an automatic title as an empty title, and a removed title as none', () => {
    const auto = convert(series(0, 'B'), '<c:title><c:overlay val="0"/></c:title><c:autoTitleDeleted val="0"/>');
    expect(auto.title?.text).toBeUndefined();
    expect(auto.title?.formula).toBeUndefined();
    const removed = convert(series(0, 'B'), '<c:autoTitleDeleted val="1"/>');
    expect(removed.title).toBeUndefined();
    expect(removed).not.toHaveProperty('autoTitleDeleted');
    const custom = convert(series(0, 'B'),
      '<c:title><c:tx><c:rich><a:bodyPr/><a:p><a:r><a:t>My title</a:t></a:r></a:p></c:rich></c:tx>' +
      '<c:overlay val="0"/></c:title><c:autoTitleDeleted val="0"/>');
    expect(custom.title).toMatchObject({ text: 'My title' });
  });

  it('leaves out a series order that follows the series lists', () => {
    const chart = convert(series(0, 'B') + series(1, 'C'));
    expect(chart.plots[0].series?.map(s => s.order)).toEqual([ undefined, undefined ]);
  });

  it('keeps a series order that interleaves plots, and drops one with gaps that still rises', () => {
    const plot = (orders: number[]) => ({ series: orders.map(order => ({ id: 's' + order, order })) }) as ChartPlot;
    const interleaved = [ plot([ 0, 2 ]), plot([ 1 ]) ];
    dropDefaultSeriesOrder(interleaved);
    expect(interleaved.flatMap(p => p.series!.map(s => s.order))).toEqual([ 0, 2, 1 ]);
    const gaps = [ plot([ 0, 2 ]), plot([ 5 ]) ];
    dropDefaultSeriesOrder(gaps);
    expect(gaps.flatMap(p => p.series!.map(s => s.order))).toEqual([ undefined, undefined, undefined ]);
  });

  it('identifies deleted legend entries by what they show', () => {
    const entry = (idx: number) => `<c:legendEntry><c:idx val="${idx}"/><c:delete val="1"/></c:legendEntry>`;
    const trend = '<c:trendline><c:trendlineType val="linear"/></c:trendline>';
    // two series, the first with a trendline, whose entry comes after both series
    const chart = convert(series(0, 'B', trend) + series(1, 'C'), `<c:legend><c:legendPos val="r"/>${entry(1)}${entry(2)}</c:legend>`);
    expect(chart.legend?.hiddenEntries).toEqual([ { series: 's1' }, { series: 's0', trendline: 0 } ]);
  });

  it('numbers deleted legend entries by c:idx, not by series order', () => {
    const ser = (idx: number, order: number, col: string) => series(idx, col).replace(`<c:order val="${idx}"/>`, `<c:order val="${order}"/>`);
    const entry = '<c:legendEntry><c:idx val="1"/><c:delete val="1"/></c:legendEntry>';
    // the series with c:idx 1 is the third in series order
    const chart = convert(ser(0, 0, 'B') + ser(2, 1, 'C') + ser(1, 2, 'D'), `<c:legend><c:legendPos val="r"/>${entry}</c:legend>`);
    expect(chart.legend?.hiddenEntries).toEqual([ { series: 's1' } ]);
    expect(chart.plots[0].series.find(s => s.id === 's1')?.colorIndex).toBe(1);
  });

  it('numbers series by their rank in c:idx order, and trendlines after them in series order', () => {
    const ser = (idx: number, order: number, col: string, extra = '') => series(idx, col, extra).replace(`<c:order val="${idx}"/>`, `<c:order val="${order}"/>`);
    const trend = (type: string) => `<c:trendline><c:trendlineType val="${type}"/></c:trendline>`;
    const legend = (...idx: number[]) => '<c:legend><c:legendPos val="r"/>' +
      idx.map(i => `<c:legendEntry><c:idx val="${i}"/><c:delete val="1"/></c:legendEntry>`).join('') + '</c:legend>';

    // a gap in c:idx (0, 2, 3): the series are entries 0-2, and the trendline is entry 3
    const gap = convert(ser(0, 0, 'B') + ser(2, 1, 'C') + ser(3, 2, 'D', trend('linear')), legend(2, 3));
    expect(gap.legend?.hiddenEntries).toEqual([ { series: 's3' }, { series: 's3', trendline: 0 } ]);

    // series order D, B (c:idx 3, 1): D's trendlines come first, then B's
    const several = convert(
      ser(3, 0, 'E', trend('linear') + trend('movingAvg')) + ser(1, 1, 'C', trend('linear')) + ser(0, 2, 'B') + ser(2, 3, 'D'),
      legend(5, 6),
    );
    expect(several.legend?.hiddenEntries).toEqual([ { series: 's3', trendline: 1 }, { series: 's1', trendline: 0 } ]);
  });

  it('keeps only the formula of text taken from a cell', () => {
    expect(convert(series(0, 'B')).plots[0].series![0].name).toEqual({ formula: 'Sheet1!$B$1' });
  });
});
