import { describe, it, expect } from 'vitest';
import { parseXML } from '@borgar/simple-xml';
import { ConversionContext } from '../../ConversionContext.ts';
import { handlerChart } from '../chart.ts';
import { convertChartSpaceEx } from './convertChartSpaceEx.ts';

const NS = 'xmlns:cx="http://schemas.microsoft.com/office/drawing/2014/chartex" ' +
  'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"';

const DATA = '<cx:chartData>' +
  '<cx:data id="0"><cx:strDim type="cat"><cx:f>Sheet1!$A$2:$A$6</cx:f></cx:strDim>' +
  '<cx:numDim type="val"><cx:f>Sheet1!$B$2:$B$6</cx:f></cx:numDim></cx:data>' +
  '<cx:data id="1"><cx:strDim type="cat"><cx:f>Sheet1!$A$2:$A$6</cx:f></cx:strDim>' +
  '<cx:numDim type="val"><cx:f>Sheet1!$C$2:$C$6</cx:f></cx:numDim></cx:data>' +
  '</cx:chartData>';

const AXES = '<cx:axis id="0"><cx:catScaling gapWidth="0.5"/><cx:tickLabels/></cx:axis>' +
  '<cx:axis id="1"><cx:valScaling max="100" min="auto"/><cx:majorGridlines/><cx:tickLabels/></cx:axis>';

function series (layoutId: string, dataId: number, extra = '', attrs = '') {
  return `<cx:series layoutId="${layoutId}" formatIdx="${dataId}"${attrs}>` +
    `<cx:tx><cx:txData><cx:f>Sheet1!$${'BC'[dataId]}$1</cx:f><cx:v>Name</cx:v></cx:txData></cx:tx>` +
    `<cx:dataId val="${dataId}"/>${extra}</cx:series>`;
}

function convert (seriesXml: string, { axes = AXES, data = DATA, chartExtra = '' } = {}) {
  const xml = `<cx:chartSpace ${NS}>${data}<cx:chart>${chartExtra}<cx:plotArea><cx:plotAreaRegion>` +
    `${seriesXml}</cx:plotAreaRegion>${axes}</cx:plotArea></cx:chart></cx:chartSpace>`;
  const context = new ConversionContext();
  const chart = convertChartSpaceEx(handlerChart(parseXML(xml), context, true), context);
  return { chart: chart!, context };
}

describe('convertChartSpaceEx', () => {
  it('converts a histogram to a bin transform and a bar plot', () => {
    const { chart } = convert(series('clusteredColumn', 0,
      '<cx:layoutPr><cx:binning intervalClosed="l" underflow="auto" overflow="90">' +
      '<cx:binSize val="10"/></cx:binning></cx:layoutPr>'));
    expect(chart.transforms).toEqual([ {
      id: 'bins1',
      type: 'bin',
      source: 'data',
      field: 'value',
      groupBy: [ 'series' ],
      binning: { type: 'width', width: 10, overflow: 90, underflow: 'auto', intervalClosed: 'left' },
      as: { start: 'binStart', end: 'binEnd', count: 'count' },
    } ]);
    const plot = chart.plots[0];
    expect(plot).toMatchObject({ mark: 'bar', data: 'bins1', layout: { type: 'bar', gapWidth: 50 } });
    expect(plot.encoding.y).toEqual({ field: 'count', scale: 'value' });
  });

  it('converts a bin count', () => {
    const { chart } = convert(series('clusteredColumn', 0,
      '<cx:layoutPr><cx:binning><cx:binCount val="4"/></cx:binning></cx:layoutPr>'));
    expect(chart.transforms?.[0]).toMatchObject({ binning: { type: 'count', count: 4 } });
  });

  it('converts a Pareto chart to category bins, a bar plot, and a line plot', () => {
    const { chart } = convert(
      series('clusteredColumn', 0, '<cx:layoutPr><cx:aggregation/></cx:layoutPr><cx:axisId val="1"/>') +
      '<cx:series layoutId="paretoLine" ownerIdx="0" formatIdx="1"><cx:axisId val="2"/></cx:series>',
      { axes: AXES + '<cx:axis id="2"><cx:valScaling max="1" min="0"/><cx:units unit="percentage"/><cx:tickLabels/></cx:axis>' },
    );
    expect(chart.transforms?.[0]).toMatchObject({
      binning: { type: 'category' },
      as: { cumulative: 'cumulative' },
    });
    expect(chart.plots.map(p => [ p.mark, p.axisGroup ?? 'primary' ])).toEqual([ [ 'bar', 'primary' ], [ 'line', 'secondary' ] ]);
    const line = chart.plots[1];
    expect(line.encoding.y).toEqual({ field: 'cumulative', scale: 'value2' });
    // The bar series' key is its ID, so it's left out. The line shares the bar's key.
    expect(chart.plots[0].series?.[0]).not.toHaveProperty('key');
    expect(line.series?.[0]).toEqual({ id: 's1', key: 's0' });
    expect(chart.axes?.find(a => a.scale === 'value2')).toMatchObject({ orient: 'right', displayUnits: 'percent' });
  });

  it('converts a box and whisker chart', () => {
    const { chart } = convert(series('boxWhisker', 0,
      '<cx:layoutPr><cx:visibility meanLine="1" meanMarker="0" nonoutliers="1" outliers="1"/>' +
      '<cx:statistics quartileMethod="inclusive"/></cx:layoutPr>'));
    expect(chart.transforms?.[0]).toMatchObject({
      type: 'boxplot',
      groupBy: [ 'series', 'category' ],
      quartileMethod: 'inclusive',
    });
    expect(chart.plots[0].layout).toEqual({
      type: 'boxplot',
      gapWidth: 50,
      showMeanMarkers: false,
      showMeanLine: true,
      showInnerPoints: true,
    });
  });

  it('converts a waterfall chart, with subtotals and connector lines', () => {
    const { chart } = convert(series('waterfall', 0,
      '<cx:layoutPr><cx:visibility connectorLines="1"/><cx:subtotals><cx:idx val="4"/></cx:subtotals></cx:layoutPr>'));
    expect(chart.transforms?.[0]).toMatchObject({ type: 'waterfall', groupBy: [ 'series' ], subtotals: [ 4 ] });
    expect(chart.plots[0].layout).toEqual({ type: 'waterfall', gapWidth: 50, showConnectorLines: true });
  });

  it('turns on waterfall connector lines when cx:visibility is absent, as Excel does', () => {
    const { chart } = convert(series('waterfall', 0,
      '<cx:layoutPr><cx:subtotals><cx:idx val="0"/></cx:subtotals></cx:layoutPr>'));
    expect(chart.plots[0].layout).toEqual({ type: 'waterfall', gapWidth: 50, showConnectorLines: true });
  });

  it('converts a treemap with two category levels to a hierarchy transform', () => {
    const data = '<cx:chartData><cx:data id="0"><cx:strDim type="cat"><cx:f>Sheet1!$A$2:$B$9</cx:f></cx:strDim>' +
      '<cx:numDim type="size"><cx:f>Sheet1!$C$2:$C$9</cx:f></cx:numDim></cx:data></cx:chartData>';
    const { chart } = convert(series('treemap', 0, '<cx:layoutPr><cx:parentLabelLayout val="banner"/></cx:layoutPr>'),
      { axes: '', data });
    expect(chart.transforms?.[0]).toEqual({
      id: 'hierarchy1',
      type: 'hierarchy',
      source: 'data',
      levels: [ 'category1', 'category' ],
      valueField: 'size',
    });
    const s = chart.plots[0].series![0];
    expect(s.bindings?.size).toEqual({ formula: 'Sheet1!$C$2:$C$9', role: 'size' });
    expect(s.bindings?.category1).toMatchObject({ formula: 'Sheet1!$A$2:$B$9', level: 1 });
    expect(chart.plots[0].layout).toEqual({ type: 'treemap', parentLabelLayout: 'banner' });
  });

  it('keeps each level of literal multi-level categories', () => {
    const data = '<cx:chartData><cx:data id="0"><cx:strDim type="cat">' +
      '<cx:lvl ptCount="2"><cx:pt idx="0">Apples</cx:pt><cx:pt idx="1">Pears</cx:pt></cx:lvl>' +
      '<cx:lvl ptCount="2"><cx:pt idx="0">Fruit</cx:pt><cx:pt idx="1">Fruit</cx:pt></cx:lvl></cx:strDim>' +
      '<cx:numDim type="size"><cx:lvl ptCount="2"><cx:pt idx="0">3</cx:pt><cx:pt idx="1">4</cx:pt></cx:lvl>' +
      '</cx:numDim></cx:data></cx:chartData>';
    const { chart } = convert(series('treemap', 0), { axes: '', data });
    const s = chart.plots[0].series![0];
    expect(s.bindings?.category).toEqual({ values: [ 'Apples', 'Pears' ], role: 'category', level: 0 });
    expect(s.bindings?.category1).toEqual({ values: [ 'Fruit', 'Fruit' ], role: 'category', level: 1 });
  });

  it('converts a funnel, with the categories down the left side', () => {
    const { chart } = convert(series('funnel', 0), { axes: '<cx:axis id="0"><cx:catScaling gapWidth="0.2"/><cx:tickLabels/></cx:axis>' });
    expect(chart.plots[0]).toMatchObject({
      mark: 'funnel',
      encoding: { y: { field: 'category', scale: 'category' }, x: { field: 'value' } },
      layout: { type: 'funnel', gapWidth: 20 },
    });
    expect(chart.axes?.[0].orient).toBe('left');
  });

  it('reads series names, colors, hidden series, labels, and points', () => {
    const { chart } = convert(
      series('waterfall', 0,
        '<cx:dataPt idx="2"><cx:spPr><a:solidFill><a:srgbClr val="FF0000"/></a:solidFill></cx:spPr></cx:dataPt>' +
        '<cx:dataLabels pos="outEnd"><cx:visibility seriesName="0" categoryName="1" value="1"/>' +
        '<cx:dataLabelHidden idx="3"/></cx:dataLabels>') +
      series('waterfall', 1, '', ' hidden="1"'),
    );
    const [ first, second ] = chart.plots[0].series!;
    expect(first).toMatchObject({ name: { formula: 'Sheet1!$B$1' }, labels: { show: [ 'value', 'category' ], position: 'outsideEnd' } });
    // the color index is the series' position, the default, so it's left out
    expect(first).not.toHaveProperty('colorIndex');
    expect(first.points).toEqual([
      { index: 2, shape: { fill: { type: 'solid', bg: { type: 'srgb', value: 'FF0000' } } } },
      { index: 3, label: { hidden: true } },
    ]);
    expect(second).toMatchObject({ hidden: true });
  });

  it('converts axes: scaling, tick labels, gridlines, and missing tick marks', () => {
    const { chart } = convert(series('waterfall', 0),
      { axes: '<cx:axis id="0" hidden="1"><cx:catScaling/></cx:axis>' +
        '<cx:axis id="1"><cx:valScaling max="100" min="auto" majorUnit="20"/><cx:majorGridlines/><cx:tickLabels/></cx:axis>' });
    expect(chart.scales).toEqual([ { id: 'category', type: 'band' }, { id: 'value', type: 'linear', max: 100, majorUnit: 20 } ]);
    expect(chart.axes).toMatchObject([
      { id: 'categoryAxis', orient: 'bottom', hidden: true, tickMarks: { major: 'none' }, tickLabels: { position: 'none' } },
      { id: 'valueAxis', orient: 'left', tickMarks: { major: 'none' }, gridlines: { major: {} } },
    ]);
    expect(chart.axes![1].tickLabels).toBeUndefined();
  });

  it('places the title and the legend', () => {
    const { chart } = convert(series('waterfall', 0), {
      chartExtra: '<cx:title pos="b" align="min" overlay="1"><cx:tx><cx:txData><cx:v>Sales</cx:v></cx:txData></cx:tx></cx:title>',
    });
    expect(chart.title).toEqual({ text: 'Sales', overlay: true });
  });

  it('keeps an automatic title as an empty title, and a removed title as none', () => {
    const auto = convert(series('waterfall', 0), { chartExtra: '<cx:title pos="t" align="ctr" overlay="0"/>' });
    expect(auto.chart.title).toEqual({});
    expect(convert(series('waterfall', 0)).chart.title).toBeUndefined();
  });

  it('reads waterfall column colors from fmtOvrs, and legend text from a:endParaRPr', () => {
    // Modeled on a waterfall saved by Excel, with Decrease and Total recolored.
    const xml = `<cx:chartSpace ${NS}>` +
      '<cx:chartData><cx:data id="0"><cx:numDim type="val"><cx:f>Sheet1!$A$1:$A$7</cx:f></cx:numDim></cx:data></cx:chartData>' +
      '<cx:chart><cx:title pos="t" align="ctr" overlay="0"/><cx:plotArea><cx:plotAreaRegion>' +
      '<cx:series layoutId="waterfall"><cx:dataPt idx="0"/><cx:dataPt idx="6"/><cx:dataId val="0"/>' +
      '<cx:layoutPr><cx:visibility connectorLines="0"/><cx:subtotals><cx:idx val="6"/></cx:subtotals></cx:layoutPr>' +
      '</cx:series></cx:plotAreaRegion>' +
      '<cx:axis id="0"><cx:catScaling gapWidth="0.5"/><cx:tickLabels/></cx:axis>' +
      '<cx:axis id="1"><cx:valScaling/><cx:majorGridlines/><cx:tickLabels/></cx:axis></cx:plotArea>' +
      '<cx:legend pos="t" align="ctr" overlay="0"><cx:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr/></a:pPr>' +
      '<a:endParaRPr lang="en-US" sz="900"><a:latin typeface="Aptos Narrow"/></a:endParaRPr></a:p></cx:txPr></cx:legend>' +
      '</cx:chart><cx:fmtOvrs>' +
      '<cx:fmtOvr idx="2"><cx:spPr><a:solidFill><a:schemeClr val="accent5"/></a:solidFill></cx:spPr></cx:fmtOvr>' +
      '<cx:fmtOvr idx="1"><cx:spPr><a:solidFill><a:srgbClr val="FFC000"/></a:solidFill></cx:spPr></cx:fmtOvr>' +
      '</cx:fmtOvrs></cx:chartSpace>';
    const context = new ConversionContext();
    const chart = convertChartSpaceEx(handlerChart(parseXML(xml), context, true), context)!;
    expect(chart.plots[0].layout).toEqual({
      type: 'waterfall',
      gapWidth: 50,
      decrease: { fill: { type: 'solid', bg: { type: 'srgb', value: 'FFC000' } } },
      total: { fill: { type: 'solid', bg: { type: 'theme', value: 'accent5' } } },
    });
    expect(chart.transforms?.[0]).toMatchObject({ subtotals: [ 6 ] });
    // Only a value dimension: no category binding, and the empty data points are dropped.
    expect(chart.plots[0].series?.[0].bindings).toEqual({ value: { formula: 'Sheet1!$A$1:$A$7', role: 'value' } });
    expect(chart.plots[0].series?.[0].points).toBeUndefined();
    expect(chart.title).toEqual({});
    // 9pt is the default for legends, so only the typeface remains.
    expect(chart.legend?.textStyle).toEqual({ fontFamily: 'Aptos Narrow' });
  });

  it('leaves out region maps', () => {
    const { chart, context } = convert(series('regionMap', 0));
    expect(chart).toBeUndefined();
    expect(context.unsupported.has('chart-chartex')).toBe(true);
  });
});
