import type { Chart } from '@jsfkit/types';
import { describe, it, expect } from 'vitest';
import { parseXML } from '@borgar/simple-xml';
import { ConversionContext } from '../../ConversionContext.ts';
import { readShapeProperties } from '../drawings/readShapeProperties.ts';
import { handlerChart } from '../chart.ts';
import { convertChartSpace } from './convertChartSpace.ts';
import { automaticColor, JSF_SHAPE_DEFAULTS, type ShapeElement } from './shapeDefaults.ts';

const NS = [
  'xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"',
  'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"',
].join(' ');

function readSpPr (xml: string) {
  return readShapeProperties(parseXML(`<c:spPr ${NS}>${xml}</c:spPr>`).root, new ConversionContext());
}

const LN_15_85 = '<a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="tx1">' +
  '<a:lumMod val="15000"/><a:lumOff val="85000"/></a:schemeClr></a:solidFill><a:round/></a:ln>';
const NONE = '<a:noFill/><a:ln><a:noFill/></a:ln>';
const ACCENT2 = '<a:solidFill><a:schemeClr val="accent2"/></a:solidFill>';

// The shape properties that Excel writes on each element of a new chart (chart style part 201).
const EXCEL_WRITES: [ShapeElement, string][] = [
  [ 'chartArea', '<a:solidFill><a:schemeClr val="bg1"/></a:solidFill>' + LN_15_85 ],
  [ 'plotArea', NONE ],
  [ 'wall', NONE ],
  [ 'label', NONE ],
  [ 'categoryAxis', '<a:noFill/>' + LN_15_85 ],
  [ 'axis', NONE ],
  [ 'majorGridlines', LN_15_85 ],
  [ 'minorGridlines', LN_15_85.replace('15000', '5000').replace('85000', '95000') ],
  [ 'lineSeries', `<a:noFill/><a:ln w="28575" cap="rnd">${ACCENT2}<a:round/></a:ln>` ],
  [ 'filledSeries', `${ACCENT2}<a:ln><a:noFill/></a:ln>` ],
  [ 'marker', `${ACCENT2}<a:ln w="9525">${ACCENT2}</a:ln>` ],
  [ 'trendline', `<a:ln w="19050" cap="rnd">${ACCENT2}<a:prstDash val="sysDot"/></a:ln>` ],
  [ 'errorBars', LN_15_85.replace('15000', '65000').replace('85000', '35000') ],
  [ 'connectorLines', LN_15_85.replace('15000', '35000').replace('85000', '65000') ],
  [ 'highLowLines', LN_15_85.replace('15000', '75000').replace('85000', '25000') ],
  [ 'upBars', '<a:solidFill><a:schemeClr val="lt1"/></a:solidFill>' +
    LN_15_85.replace('15000', '65000').replace('85000', '35000') ],
  [ 'downBars', '<a:solidFill><a:schemeClr val="dk1"><a:lumMod val="75000"/><a:lumOff val="25000"/></a:schemeClr>' +
    '</a:solidFill>' + LN_15_85.replace('15000', '65000').replace('85000', '35000') ],
];

describe('JSF_SHAPE_DEFAULTS', () => {
  it.each(EXCEL_WRITES)('matches what Excel writes for %s', (element, xml) => {
    const read = readSpPr(xml)!;
    const defaults = JSF_SHAPE_DEFAULTS(element, { type: 'theme', value: 'accent2' });
    expect(read.line).toEqual(defaults.line);
    if (defaults.fill) {
      expect(read.fill).toEqual(defaults.fill);
    }
  });
});

describe('automaticColor', () => {
  it('cycles through the accents, then changes their luminance', () => {
    expect(automaticColor(1)).toEqual({ type: 'theme', value: 'accent2' });
    expect(automaticColor(7)).toEqual({ type: 'theme', value: 'accent2', transforms: [ { type: 'lumMod', value: 60 } ] });
  });
});

function convert (plot: string, axes: string, chartExtra = '', spaceExtra = ''): Chart {
  const xml = `<c:chartSpace ${NS}><c:chart>${chartExtra}<c:plotArea><c:layout/>${plot}${axes}` +
    `</c:plotArea></c:chart>${spaceExtra}</c:chartSpace>`;
  const context = new ConversionContext();
  return convertChartSpace(handlerChart(parseXML(xml), context), context)!;
}

function barChart (seriesSpPr: string, catAx: string, valAx: string, gridlines: string) {
  const ser = '<c:ser><c:idx val="1"/><c:order val="0"/>' + seriesSpPr +
    '<c:cat><c:strRef><c:f>Sheet1!$A$2:$A$4</c:f></c:strRef></c:cat>' +
    '<c:val><c:numRef><c:f>Sheet1!$C$2:$C$4</c:f></c:numRef></c:val></c:ser>';
  return [
    `<c:barChart><c:barDir val="col"/><c:grouping val="clustered"/><c:varyColors val="0"/>${ser}` +
      '<c:axId val="10"/><c:axId val="20"/></c:barChart>',
    `<c:catAx><c:axId val="10"/><c:axPos val="b"/>${catAx}<c:crossAx val="20"/></c:catAx>` +
      `<c:valAx><c:axId val="20"/><c:axPos val="l"/>${gridlines}${valAx}<c:crossAx val="10"/></c:valAx>`,
  ];
}

describe('importing shapes', () => {
  it('leaves out what a chart at Excel\'s default style writes', () => {
    const [ plot, axes ] = barChart(
      `<c:spPr>${ACCENT2}<a:ln><a:noFill/></a:ln></c:spPr>`,
      `<c:spPr><a:noFill/>${LN_15_85}</c:spPr>`,
      `<c:spPr>${NONE}</c:spPr>`,
      `<c:majorGridlines><c:spPr>${LN_15_85}</c:spPr></c:majorGridlines>`,
    );
    const chart = convert(plot, `${axes}<c:spPr>${NONE}</c:spPr>`, '',
      `<c:spPr><a:solidFill><a:schemeClr val="bg1"/></a:solidFill>${LN_15_85}</c:spPr>`);
    expect(chart.shape).toBeUndefined();
    expect(chart.plotArea?.shape).toBeUndefined();
    expect(chart.plots[0].series[0].shape).toBeUndefined();
    expect(chart.axes?.map(a => a.shape)).toEqual([ undefined, undefined ]);
    expect(chart.axes?.[1].gridlines).toEqual({ major: {} });
  });

  it('writes out Excel\'s automatic formatting where a file leaves shapes out', () => {
    const [ plot, axes ] = barChart('', '', '', '<c:majorGridlines/>');
    const chart = convert(plot, axes);
    // the width matches the default line's, so it's left out
    const tint75 = {
      fill: { type: 'solid', bg: { type: 'theme', value: 'tx1', transforms: [ { type: 'tint', value: 75 } ] } },
    };
    expect(chart.shape).toEqual({ line: tint75 });
    expect(chart.plotArea?.shape).toEqual({ fill: { type: 'solid', bg: { type: 'theme', value: 'bg1' } } });
    expect(chart.plots[0].series[0].shape).toBeUndefined();
    // a value axis has no line by default, so its line keeps its width
    expect(chart.axes?.map(a => a.shape)).toEqual([ { line: tint75 }, { line: { ...tint75, width: 9525 } } ]);
    expect(chart.axes?.[1].gridlines).toEqual({ major: tint75 });
  });

  it('treats a missing fill or line in c:spPr as automatic', () => {
    const [ plot, axes ] = barChart(`<c:spPr>${ACCENT2}</c:spPr>`, '<c:spPr><a:noFill/></c:spPr>', '', '');
    const chart = convert(plot, axes, '', '<c:spPr/>');
    expect(chart.plots[0].series[0].shape).toBeUndefined();
    const tint75 = { type: 'theme', value: 'tx1', transforms: [ { type: 'tint', value: 75 } ] };
    expect(chart.shape?.line?.fill).toEqual({ type: 'solid', bg: tint75 });
    expect(chart.axes?.[0].shape?.fill).toBeUndefined();
  });

  it('gives a floor without shape properties a line, but not the walls', () => {
    const ser = '<c:ser><c:idx val="0"/><c:order val="0"/><c:spPr>' + ACCENT2.replace('accent2', 'accent1') +
      '<a:ln><a:noFill/></a:ln></c:spPr><c:cat><c:strRef><c:f>Sheet1!$A$2:$A$4</c:f></c:strRef></c:cat>' +
      '<c:val><c:numRef><c:f>Sheet1!$B$2:$B$4</c:f></c:numRef></c:val></c:ser>';
    const plot = `<c:bar3DChart><c:barDir val="col"/><c:grouping val="clustered"/><c:varyColors val="0"/>${ser}` +
      '<c:axId val="10"/><c:axId val="20"/></c:bar3DChart>';
    const walls = '<c:view3D/><c:floor><c:thickness val="0"/></c:floor><c:sideWall><c:thickness val="0"/></c:sideWall>' +
      '<c:backWall><c:thickness val="0"/></c:backWall>';
    const chart = convert(plot, '', walls);
    const tint75 = { type: 'solid', bg: { type: 'theme', value: 'tx1', transforms: [ { type: 'tint', value: 75 } ] } };
    expect(chart.floor).toEqual({ shape: { line: { width: 9525, fill: tint75 } } });
    expect(chart.sideWall).toBeUndefined();
    expect(chart.backWall).toBeUndefined();
  });

  it('leaves out pie slice fills that match their automatic colors', () => {
    const dPt = (i: number, accent: number) => `<c:dPt><c:idx val="${i}"/><c:bubble3D val="0"/><c:spPr>` +
      `<a:solidFill><a:schemeClr val="accent${accent}"/></a:solidFill><a:ln><a:noFill/></a:ln></c:spPr></c:dPt>`;
    const plot = '<c:pieChart><c:varyColors val="1"/><c:ser><c:idx val="0"/><c:order val="0"/>' +
      dPt(0, 1) + dPt(1, 5) + dPt(2, 3) +
      '<c:cat><c:strRef><c:f>Sheet1!$A$2:$A$4</c:f></c:strRef></c:cat>' +
      '<c:val><c:numRef><c:f>Sheet1!$B$2:$B$4</c:f></c:numRef></c:val></c:ser>' +
      '<c:firstSliceAng val="0"/></c:pieChart>';
    const chart = convert(plot, '');
    const series = chart.plots[0].series[0];
    expect(series.shape).toBeUndefined();
    expect(series.points).toEqual([
      { index: 1, shape: { fill: { type: 'solid', bg: { type: 'theme', value: 'accent5' } } } },
    ]);
  });
});
