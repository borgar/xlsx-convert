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
import { readShapeProperties } from '../drawings/readShapeProperties.ts';
import { readSeries } from './readSeries.ts';
import { readAxis } from './readAxis.ts';
import { readDLbls } from './readDLbls.ts';
import { readNumFmt } from './readNumFmt.ts';
import { readTextProps } from './readTextProps.ts';
import { readTitle } from './readTitle.ts';
import { getFirstChild } from '../../utils/getFirstChild.ts';
import type { PlotArea } from './types/PlotArea.ts';
import type { Plot } from './types/plots/Plot.ts';
import type { WaterfallChart } from './types/plots/WaterfallChart.ts';
import type { Series } from './types/series/Series.ts';
import type { CatAx } from './types/axes/CatAx.ts';
import type { ValAx } from './types/axes/ValAx.ts';
import type { TickMark } from './types/axes/TickMark.ts';
import type { Shape } from '@jsfkit/types';

export type FmtOvrsMap = Map<number, Shape>;
import type { ChartDataMap } from './readChartData.ts';
import { attr, boolAttr, numAttr } from '../../utils/attr.ts';

/**
 * XLSX plot area XML tag to JSF plot area type.
 */
const TAG_NAME_TO_CHART_TYPE: Record<string, Plot['type']> = {
  areaChart: 'area',
  area3DChart: 'area3d',
  lineChart: 'line',
  line3DChart: 'line3d',
  stockChart: 'stock',
  radarChart: 'radar',
  scatterChart: 'scatter',
  pieChart: 'pie',
  pie3DChart: 'pie3d',
  doughnutChart: 'doughnut',
  barChart: 'bar',
  bar3DChart: 'bar3d',
  ofPieChart: 'ofPie',
  surfaceChart: 'surface',
  surface3DChart: 'surface3d',
  bubbleChart: 'bubble',
};

function readPlot (element: Element, context: ConversionContext) {
  // console.log(element.tagName);

  const out: any = {
    type: TAG_NAME_TO_CHART_TYPE[element.tagName] ?? element.tagName,
  };

  addProp(out, 'barDir', strValElm(element.querySelector('barDir')!)); // col | row
  addProp(out, 'grouping', strValElm(element.querySelector('grouping')!)); // clustered

  const varyColorsElm = element.querySelector('varyColors');
  addProp(out, 'varyColors', varyColorsElm ? boolValElm(varyColorsElm, true) : true, false);
  addProp(out, 'gapWidth', numValElm(element.querySelector('gapWidth')!));
  addProp(out, 'overlap', numValElm(element.querySelector('overlap')!));
  // Use getFirstChild instead of querySelector to avoid matching series-level <marker> elements.
  const markerElm = getFirstChild(element, 'marker');
  if (markerElm) {
    addProp(out, 'marker', boolValElm(markerElm), false);
  }
  addProp(out, 'scatterStyle', strValElm(element.querySelector('scatterStyle')!));
  addProp(out, 'radarStyle', strValElm(element.querySelector('radarStyle')!));

  // Bubble-chart-specific properties.
  const bubbleScaleElm = getFirstChild(element, 'bubbleScale');
  if (bubbleScaleElm) {
    addProp(out, 'bubbleScale', numValElm(bubbleScaleElm));
  }
  const showNegBubblesElm = getFirstChild(element, 'showNegBubbles');
  if (showNegBubblesElm) {
    addProp(out, 'showNegBubbles', boolValElm(showNegBubblesElm), false);
  }
  const sizeRepresentsElm = getFirstChild(element, 'sizeRepresents');
  if (sizeRepresentsElm) {
    addProp(out, 'sizeRepresents', strValElm(sizeRepresentsElm));
  }
  const bubble3DElm = getFirstChild(element, 'bubble3D');
  if (bubble3DElm) {
    addProp(out, 'bubble3D', boolValElm(bubble3DElm), false);
  }

  // pie
  const firstSliceAng = getFirstChild(element, 'firstSliceAng');
  if (firstSliceAng) {
    addProp(out, 'firstSliceAng', numValElm(firstSliceAng));
  }
  const holeSize = getFirstChild(element, 'holeSize');
  if (holeSize) {
    addProp(out, 'holeSize', numValElm(holeSize), 75);
  }

  out.axId = element.querySelectorAll('axId').map(d => numValElm(d));
  out.ser = [];
  const ser = element.querySelectorAll('ser');
  ser.forEach((s, i) => {
    out.ser[i] = readSeries(s, context);
    // console.dir(, { depth: 80 });
    // const subTags = new Set(s.children.map(d => d.tagName));
    // console.log('ser', subTags);
  });

  // Chart-level data labels: the <c:dLbls> child of <c:*Chart>. Use getFirstChild to avoid matching
  // any series-level <c:dLbls> reachable via the descendant-combinator behaviour of querySelector.
  const dLblsElm = getFirstChild(element, 'dLbls');
  if (dLblsElm) {
    out.dLbls = readDLbls(dLblsElm, context);
  }

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

function readChartExAxis (element: Element, context: ConversionContext, crossAxId: number): CatAx | ValAx | undefined {
  const axId = numAttr(element, 'id', null);
  if (axId == null) return undefined;

  const isHidden = boolAttr(element, 'hidden', false) ?? false;
  const isVal = !!element.querySelector('valScaling');

  const shared = {
    axId,
    axPos: isVal ? 'l' : 'b',
    crossAx: crossAxId,
    crosses: 'autoZero',
    ...(isHidden ? { delete: true } : {}),
  } as const;

  const out: Partial<CatAx | ValAx> = isVal
    ? { type: 'valAx', ...shared }
    : { type: 'catAx', ...shared };

  for (const child of element.children) {
    if (child.tagName === 'valScaling') {
      const parseVal = (v: string | null): 'auto' | number => (v == null || v === 'auto' ? 'auto' : +v);
      addProp(out as Partial<ValAx>, 'majorUnit', parseVal(attr(child, 'majorUnit')) === 'auto' ? undefined : +attr(child, 'majorUnit')!);
      addProp(out as Partial<ValAx>, 'minorUnit', parseVal(attr(child, 'minorUnit')) === 'auto' ? undefined : +attr(child, 'minorUnit')!);
    }
    else if (child.tagName === 'majorGridlines') {
      const spPr = child.querySelector('spPr');
      if (spPr) { addProp(out, 'majorGridlines', readShapeProperties(spPr, context)); }
    }
    else if (child.tagName === 'minorGridlines') {
      const spPr = child.querySelector('spPr');
      if (spPr) { addProp(out, 'minorGridlines', readShapeProperties(spPr, context)); }
    }
    else if (child.tagName === 'majorTickMarks') {
      addProp(out, 'majorTickMark', attr(child, 'type') as TickMark | null);
    }
    else if (child.tagName === 'minorTickMarks') {
      addProp(out, 'minorTickMark', attr(child, 'type') as TickMark | null);
    }
    else if (child.tagName === 'numFmt') {
      addProp(out, 'numFmt', readNumFmt(child));
    }
    else if (child.tagName === 'spPr') {
      addProp(out, 'shape', readShapeProperties(child, context));
    }
    else if (child.tagName === 'txPr') {
      addProp(out, 'textProps', readTextProps(child, context));
    }
    else if (child.tagName === 'title') {
      addProp(out, 'title', readTitle(child, context));
    }
  }

  return out as CatAx | ValAx;
}

/**
 * Parse a ChartEx <cx:plotAreaRegion> into a WaterfallChart plot.
 * Groups all series under a single WaterfallChart and collects subtotal
 * indices and axis IDs from the first series (they are chart-level in practice).
 */
function readPlotAreaRegion (
  element: Element,
  context: ConversionContext,
  chartDataMap: ChartDataMap,
  fmtOvrsMap?: FmtOvrsMap,
): WaterfallChart | undefined {
  const seriesElements = element.querySelectorAll('series');
  if (seriesElements.length === 0) return undefined;

  // Only support waterfall for now; skip other ChartEx layouts.
  const layoutId = attr(seriesElements[0]!, 'layoutId');
  if (layoutId !== 'waterfall') return undefined;

  const serArr: Series[] = [];
  const allSubtotals: number[] = [];
  const axIdSet: number[] = [];
  let connectorLines: boolean | undefined;

  for (let i = 0; i < seriesElements.length; i++) {
    const serElm = seriesElements[i]!;

    // Series name from <cx:tx><cx:txData><cx:v>
    let seriesText: string | undefined;
    const txData = serElm.querySelector('tx > txData');
    if (txData) {
      seriesText = txData.querySelector('v')?.textContent ?? undefined;
    }

    // Axis IDs (collect from first series only)
    if (i === 0) {
      for (const axElm of serElm.querySelectorAll('axisId')) {
        const id = numAttr(axElm, 'val', null);
        if (id != null) axIdSet.push(id);
      }
    }

    // Subtotals from <cx:layoutPr><cx:subtotals><cx:idx val="N"/>
    const layoutPrElm = serElm.querySelector('layoutPr');
    if (layoutPrElm) {
      const subtotalsElm = layoutPrElm.querySelector('subtotals');
      if (subtotalsElm) {
        for (const idxElm of subtotalsElm.querySelectorAll('idx')) {
          const v = numAttr(idxElm, 'val', null);
          if (v != null) allSubtotals.push(v);
        }
      }
      const visibilityElm = layoutPrElm.querySelector('visibility');
      if (visibilityElm && connectorLines === undefined) {
        const v = boolAttr(visibilityElm, 'connectorLines');
        if (v != null) connectorLines = v;
      }
    }

    // Resolve data from chartDataMap via dataId
    const dataIdElm = serElm.querySelector('dataId');
    const dataId = dataIdElm ? numAttr(dataIdElm, 'val', -1) : -1;
    const data = dataId >= 0 ? chartDataMap.get(dataId) : undefined;

    const spPrElm = serElm.children.find(c => c.tagName === 'spPr');
    const shape = spPrElm ? readShapeProperties(spPrElm, context) : undefined;
    // if (shape == null && fmtOvrsMap != null) {
    //   const formatIdx = numAttr(serElm, 'formatIdx', null);
    //   if (formatIdx != null) { shape = fmtOvrsMap.get(formatIdx); }
    // }

    const ser: Series = {
      idx: i,
      order: i,
      ...(seriesText != null ? { text: seriesText } : {}),
      ...(shape != null ? { shape } : {}),
      ...(data?.cat != null ? { cat: data.cat } : {}),
      ...(data?.val != null ? { val: data.val } : {}),
    };
    serArr.push(ser);
  }

  const axId: [number, number] = [
    axIdSet[0] ?? 0,
    axIdSet[1] ?? 1,
  ];

  const fmtOvrs: { idx: number, shape: Shape }[] = [];
  if (fmtOvrsMap) {
    for (const [ idx, shape ] of fmtOvrsMap.entries()) {
      fmtOvrs.push({ idx, shape });
    }
  }

  const plot: WaterfallChart = {
    type: 'waterfall',
    ser: serArr,
    axId,
    fmtOvrs: fmtOvrs,
    ...(allSubtotals.length > 0 ? { subtotals: allSubtotals } : {}),
    ...(connectorLines != null ? { connectorLines } : {}),
  };

  return plot;
}

/**
 *
 */
export function readPlotArea (
  element: Element,
  context: ConversionContext,
  isChartx = false,
  chartDataMap?: ChartDataMap,
  fmtOvrsMap?: FmtOvrsMap,
): PlotArea | undefined {
  const out: PlotArea = {
    plots: [],
    axes: [],
  };

  const chartExAxisElements: Element[] = [];

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
      if (plot) { out.plots.push(plot); }
    }
    else if (isChartx && child.tagName === 'plotAreaRegion') {
      const plot = readPlotAreaRegion(child, context, chartDataMap ?? new Map(), fmtOvrsMap);
      if (plot) { out.plots.push(plot); }
    }
    // Axes
    else if (!isChartx && child.tagName in AXIS_NAMES) {
      const axis = readAxis(child, context);
      if (axis) { out.axes.push(axis); }
    }
    else if (isChartx && child.tagName === 'axis') {
      chartExAxisElements.push(child);
    }
    else {
      // console.log(child.tagName);
    }
  }

  // Process ChartEx axes with mutual cross-references
  if (chartExAxisElements.length > 0) {
    const ids = chartExAxisElements.map(e => numAttr(e, 'id', 0));
    for (let i = 0; i < chartExAxisElements.length; i++) {
      // Cross to the first other axis, or self if only one axis.
      const crossId = ids.find((_, j) => j !== i) ?? ids[i]!;
      const axis = readChartExAxis(chartExAxisElements[i]!, context, crossId);
      if (axis) { out.axes.push(axis); }
    }
  }

  return out;
}
