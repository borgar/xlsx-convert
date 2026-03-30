/*

<complexType name="CT_PlotArea">
  <sequence>
    <element name="layout" type="CT_Layout" minOccurs="0" maxOccurs="1" />
    <choice minOccurs="1" maxOccurs="unbounded">
      <element name="areaChart" type="CT_AreaChart" minOccurs="1" maxOccurs="1" />
      <element name="area3DChart" type="CT_Area3DChart" minOccurs="1" maxOccurs="1" />
      <element name="lineChart" type="CT_LineChart" minOccurs="1" maxOccurs="1" />
      <element name="line3DChart" type="CT_Line3DChart" minOccurs="1" maxOccurs="1" />
      <element name="stockChart" type="CT_StockChart" minOccurs="1" maxOccurs="1" />
      <element name="radarChart" type="CT_RadarChart" minOccurs="1" maxOccurs="1" />
      <element name="scatterChart" type="CT_ScatterChart" minOccurs="1" maxOccurs="1" />
      <element name="pieChart" type="CT_PieChart" minOccurs="1" maxOccurs="1" />
      <element name="pie3DChart" type="CT_Pie3DChart" minOccurs="1" maxOccurs="1" />
      <element name="doughnutChart" type="CT_DoughnutChart" minOccurs="1" maxOccurs="1" />
      <element name="barChart" type="CT_BarChart" minOccurs="1" maxOccurs="1" />
      <element name="bar3DChart" type="CT_Bar3DChart" minOccurs="1" maxOccurs="1" />
      <element name="ofPieChart" type="CT_OfPieChart" minOccurs="1" maxOccurs="1" />
      <element name="surfaceChart" type="CT_SurfaceChart" minOccurs="1" maxOccurs="1" />
      <element name="surface3DChart" type="CT_Surface3DChart" minOccurs="1" maxOccurs="1" />
      <element name="bubbleChart" type="CT_BubbleChart" minOccurs="1" maxOccurs="1" />
    </choice>
    <choice minOccurs="0" maxOccurs="unbounded">
      <element name="valAx" type="CT_ValAx" minOccurs="1" maxOccurs="1" />
      <element name="catAx" type="CT_CatAx" minOccurs="1" maxOccurs="1" />
      <element name="dateAx" type="CT_DateAx" minOccurs="1" maxOccurs="1" />
      <element name="serAx" type="CT_SerAx" minOccurs="1" maxOccurs="1" />
    </choice>
    <element name="dTable" type="CT_DTable" minOccurs="0" maxOccurs="1" />
    <element name="spPr" type="a:CT_ShapeProperties" minOccurs="0" maxOccurs="1" />
    <element name="extLst" type="CT_ExtensionList" minOccurs="0" maxOccurs="1" />
  </sequence>
</complexType>

*/

import { Element } from '@borgar/simple-xml';
import type { ConversionContext } from '../../ConversionContext.ts';
import { boolValElm, numValElm, strValElm } from './utils/valElm.ts';
import { addProp } from '../../utils/addProp.ts';
import type { Shape } from '@jsfkit/types';
import { readShapeProperties } from '../drawings/readShapeProperties.ts';
import { getFirstChild } from '../../utils/getFirstChild.ts';
import { readSeries } from './readSeries.ts';
import type { PlotArea } from './_types/index.ts';
import { readAxis } from './readAxis.ts';

type integer = number;

export type DataSourceRef<T extends string | number> = {
  type: T extends number ? 'numRef' : 'strRef',
  f: string,
  numCache?: {
    z?: string,
    ptCount?: number,
    pts?: ({ v: T, z?: string })[],
  },
};

export type Series = {
  // shared...
  idx: integer;
  order: integer;
  // tx?: CT_SerTx;
  shape?: Shape;
  // bar...
  invertIfNegative?: boolean;
  // pictureOptions?: CT_PictureOptions;
  // dPt?: CT_DPt[];
  // dLbls?: CT_DLbls;
  // trendline?: CT_Trendline[];
  // errBars?: CT_ErrBars;
  cat?: DataSourceRef<number> | DataSourceRef<string>;
  val?: DataSourceRef<number>;
  // shape?: ST_Shape;
};

function readPlot (element: Element, context: ConversionContext) {
  // console.log(element.tagName);
  const out: any = {
    type: element.tagName,
  };

  addProp(out, 'barDir', strValElm(element.querySelector('barDir'))); // col | row
  addProp(out, 'grouping', strValElm(element.querySelector('grouping'))); // clustered
  addProp(out, 'varyColors', boolValElm(element.querySelector('varyColors')), false);
  addProp(out, 'gapWidth', numValElm(element.querySelector('gapWidth')));
  addProp(out, 'overlap', numValElm(element.querySelector('overlap')));

  out.axId = element.querySelectorAll('axId').map(d => strValElm(d));
  out.ser = [];
  const ser = element.querySelectorAll('ser');
  ser.forEach((s, i) => {
    out.ser[i] = readSeries(s, context);
    // console.dir(, { depth: 80 });
    // const subTags = new Set(s.children.map(d => d.tagName));
    // console.log('ser', subTags);
  });

  // ser
  //   idx (val)
  //   order (val)
  //   tx ...
  //   spPr ...
  //   invertIfNegative (val)
  //   cat
  //     numRef
  //       f (innerText)
  //       numCache
  //         formatCode (innerText)
  //         ptCount (val)
  //         pt* [idx=1]
  //           v
  //

  // console.log(ser[0].toString());

  // ser*
  // dLbls
  // axId

  // console.log(element.toString());

  // axId

  // Object.assign(out, readBarChartShared(element, context));

  // for (const child of element.children) {
  //   if (child.tagName === 'gapWidth') {
  //     addProp(out, 'gapWidth', readGapAmount(child, context));
  //   }
  //   else if (child.tagName === 'overlap') {
  //     addProp(out, 'overlap', readOverlap(child, context));
  //   }
  //   else if (child.tagName === 'serLines') {
  //     const serLines_ = element.querySelectorAll('>serLines');
  //     if (serLines_.length) {
  //       out.serLines = serLines_.map(child => readChartLines(child, context));
  //     }
  //   }
  //   else if (child.tagName === 'axId') {
  //     const axId_ = element.querySelectorAll('>axId');
  //     if (axId_.length === 2) {
  //       out.axId = axId_.map(child => readUnsignedInt(child, context));
  //     }
  //     else {
  //       throw new Error('Missing required element: axId');
  //     }
  //   }
  // }

  return out;
}

const PLOT_HANDLER = {
  areaChart: 1,
  area3DChart: 1,
  lineChart: 1,
  line3DChart: 1,
  stockChart: 1,
  radarChart: 1,
  scatterChart: 1,
  pieChart: 1,
  pie3DChart: 1,
  doughnutChart: 1,
  barChart: 1,
  bar3DChart: 1,
  ofPieChart: 1,
  surfaceChart: 1,
  surface3DChart: 1,
  bubbleChart: 1,
};

const AXIS_NAMES = {
  valAx: 1,
  catAx: 1,
  dateAx: 1,
  serAx: 1,
};

/**
 *
 */
export function readPlotArea (element: Element, context: ConversionContext, isChartx = false): PlotArea | undefined {
  const out: PlotArea = {
    charts: [],
    axes: [],
  };

  for (const child of element.children) {
    if (!isChartx && child.tagName === 'layout') {
      // addProp(out, 'layout', readLayout(child, context));
    }
    else if (child.tagName === 'spPr') {
      addProp(out, 'shape', readShapeProperties(child, context));
    }
    else if (!isChartx && child.tagName === 'dTable') {
      // addProp(out, 'dTable', readDTable(child, context));
    }
    // Plots
    else if (!isChartx && child.tagName in PLOT_HANDLER) {
      const plot = readPlot(child, context);
      if (plot) { out.charts.push(plot); }
    }
    else if (isChartx && child.tagName === 'plotAreaRegion') {
      const axis = readAxis(child, context);
      if (axis) { out.axes.push(axis); }
    }
    // Axes
    else if (!isChartx && child.tagName in AXIS_NAMES) {
      console.log('V0');
      console.log(String(child));
      const axis = readAxis(child, context);
      if (axis) { out.axes.push(axis); }
    }
    else if (isChartx && child.tagName === 'axis') {
      console.log('EX');
      console.log(String(child));
    }
    else {
      // console.log(child.tagName);
    }
  }

  return out;
}
