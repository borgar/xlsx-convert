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
import { boolValElm, numValElm, strValElm, xperValElm } from './utils/valElm.ts';
import { addProp } from '../../utils/addProp.ts';
import { readShapeProperties } from '../drawings/readShapeProperties.ts';
import { readSeries } from './readSeries.ts';
import { readAxis } from './readAxis.ts';
import { readLayout } from './readLayout.ts';
import { readDLbls } from './readDLbls.ts';
import { readTextProps } from './readTextProps.ts';
import { getFirstChild } from '../../utils/getFirstChild.ts';
import type { PlotArea } from './types/PlotArea.ts';
import type { Plot } from './types/plots/Plot.ts';
import type { DTable } from './types/DTable.ts';

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

/** The keys of every member of a union. */
type KeysOfUnion<T> = T extends unknown ? keyof T : never;

/**
 * A plot while it's being read. The reader handles every plot type in one pass, so each property is
 * one some plot type has, but its value isn't checked against that plot type.
 */
type PlotDraft = Partial<Record<KeysOfUnion<Plot>, unknown>>;

function readPlot (element: Element, context: ConversionContext): Plot {
  const out: PlotDraft = {
    type: TAG_NAME_TO_CHART_TYPE[element.tagName] ?? element.tagName,
  };

  addProp(out, 'barDir', strValElm(element.querySelector('barDir')!)); // col | row
  addProp(out, 'grouping', strValElm(element.querySelector('grouping')!)); // clustered

  // Excel's "vary colors by point" default when c:varyColors is ABSENT: ON for pie-likes and
  // bar charts -- the val attribute defaults to 1 and Excel applies that to the omitted element
  // (Excel-authored files always write an explicit val="0"; non-Excel producers omit it: both a
  // Google-Sheets export and an openpyxl single-series bar render vary-by-point in Excel, with
  // category legends). Other chart types stay OFF until evidenced. Note that Excel's per-point
  // LEGEND does not key on this flag alone -- a single series with per-point dPt formats gets a
  // category legend even with an explicit varyColors=0 -- so renderers should not treat false
  // as "series legend". Emit the resolved value so consumers never have to guess.
  const varyColorsElm = element.querySelector('varyColors');
  const varyDefault = out.type === 'pie' || out.type === 'pie3d' || out.type === 'doughnut' ||
    out.type === 'ofPie' || out.type === 'bar' || out.type === 'bar3d';
  out.varyColors = varyColorsElm ? boolValElm(varyColorsElm) : varyDefault;
  // Direct children only: up/down bars have a gapWidth of their own.
  const gapWidthElm = getFirstChild(element, 'gapWidth');
  if (gapWidthElm) { addProp(out, 'gapWidth', xperValElm(gapWidthElm)); }
  const overlapElm = getFirstChild(element, 'overlap');
  if (overlapElm) { addProp(out, 'overlap', xperValElm(overlapElm, -100, 100)); }
  const gapDepthElm = getFirstChild(element, 'gapDepth');
  if (gapDepthElm) { addProp(out, 'gapDepth', xperValElm(gapDepthElm)); }
  const barShapeElm = getFirstChild(element, 'shape');
  if (barShapeElm) { addProp(out, 'shape', strValElm(barShapeElm)); }

  // Lines drawn between or across series.
  const readLines = (elm: Element) => {
    const spPr = getFirstChild(elm, 'spPr');
    return { shape: spPr ? readShapeProperties(spPr, context) : {} };
  };
  const serLines = element.children.filter(d => d.tagName === 'serLines');
  if (serLines.length) { out.serLines = serLines.map(readLines); }
  const dropLinesElm = getFirstChild(element, 'dropLines');
  if (dropLinesElm) { out.dropLines = readLines(dropLinesElm); }
  const hiLowLinesElm = getFirstChild(element, 'hiLowLines');
  if (hiLowLinesElm) { out.hiLowLines = readLines(hiLowLinesElm); }
  const upDownBarsElm = getFirstChild(element, 'upDownBars');
  if (upDownBarsElm) {
    const bars: Record<string, unknown> = {};
    const barsGap = getFirstChild(upDownBarsElm, 'gapWidth');
    if (barsGap) { addProp(bars, 'gapWidth', xperValElm(barsGap)); }
    for (const kind of [ 'upBars', 'downBars' ]) {
      const barElm = getFirstChild(upDownBarsElm, kind);
      const spPr = barElm && getFirstChild(barElm, 'spPr');
      if (barElm) { bars[kind] = spPr ? { shape: readShapeProperties(spPr, context) } : {}; }
    }
    out.upDownBars = bars;
  }

  // Surface charts.
  const wireframeElm = getFirstChild(element, 'wireframe');
  if (wireframeElm) { addProp(out, 'wireframe', boolValElm(wireframeElm)); }
  const bandFmtsElm = getFirstChild(element, 'bandFmts');
  if (bandFmtsElm) {
    // a band format without an idx can't be matched to a band, so it's left out
    const bandFmt = bandFmtsElm.children
      .filter(d => d.tagName === 'bandFmt')
      .flatMap(d => {
        const idxElm = getFirstChild(d, 'idx');
        const idx = idxElm ? numValElm(idxElm) : null;
        if (idx == null) { return []; }
        const fmt: { idx: number, shape?: object } = { idx };
        const spPr = getFirstChild(d, 'spPr');
        if (spPr) { addProp(fmt, 'shape', readShapeProperties(spPr, context)); }
        return [ fmt ];
      });
    out.bandFmts = { bandFmt };
  }

  // Pie-of-pie and bar-of-pie.
  const ofPieTypeElm = getFirstChild(element, 'ofPieType');
  if (ofPieTypeElm) { addProp(out, 'ofPieType', strValElm(ofPieTypeElm)); }
  const splitTypeElm = getFirstChild(element, 'splitType');
  if (splitTypeElm) { addProp(out, 'splitType', strValElm(splitTypeElm)); }
  const splitPosElm = getFirstChild(element, 'splitPos');
  if (splitPosElm) { addProp(out, 'splitPos', numValElm(splitPosElm)); }
  const custSplitElm = getFirstChild(element, 'custSplit');
  if (custSplitElm) {
    out.custSplit = {
      secondPiePt: custSplitElm.children.filter(d => d.tagName === 'secondPiePt').map(d => numValElm(d)),
    };
  }
  const secondPieSizeElm = getFirstChild(element, 'secondPieSize');
  if (secondPieSizeElm) { addProp(out, 'secondPieSize', xperValElm(secondPieSizeElm)); }
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
    addProp(out, 'bubbleScale', xperValElm(bubbleScaleElm));
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
    addProp(out, 'holeSize', xperValElm(holeSize));
  }

  out.axId = element.querySelectorAll('axId').map(d => numValElm(d));
  // Series are direct children. Series filtered out with Excel's chart filter live in an
  // extension (c15:filteredBarSeries, c15:filteredLineSeries, ...), and are kept as hidden series.
  const ser = element.children
    .filter(d => d.tagName === 'ser')
    .map(s => readSeries(s, context))
    .filter(Boolean);
  out.ser = ser;
  const extLst = getFirstChild(element, 'extLst');
  for (const ext of extLst?.children ?? []) {
    for (const filtered of ext.children) {
      if (/^filtered\w*Series$/.test(filtered.tagName)) {
        for (const s of filtered.children.filter(d => d.tagName === 'ser')) {
          const series = readSeries(s, context);
          if (series) {
            series.hidden = true;
            ser.push(series);
          }
        }
      }
    }
  }

  // Chart-level data labels: the <c:dLbls> child of <c:*Chart>. Use getFirstChild to avoid matching
  // any series-level <c:dLbls> reachable via the descendant-combinator behaviour of querySelector.
  const dLblsElm = getFirstChild(element, 'dLbls');
  if (dLblsElm) {
    out.dLbls = readDLbls(dLblsElm, context);
  }

  return out as Plot;
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
 * Read `<c:dTable>`: a data table shown below the plot area.
 */
function readDTable (element: Element, context: ConversionContext): DTable {
  const out: DTable = {};
  for (const child of element.children) {
    if (child.tagName === 'showHorzBorder' || child.tagName === 'showVertBorder' ||
      child.tagName === 'showOutline' || child.tagName === 'showKeys') {
      addProp(out, child.tagName, boolValElm(child));
    }
    else if (child.tagName === 'spPr') {
      addProp(out, 'shape', readShapeProperties(child, context));
    }
    else if (child.tagName === 'txPr') {
      addProp(out, 'textProps', readTextProps(child, context));
    }
  }
  return out;
}

export function readPlotArea (element: Element, context: ConversionContext): PlotArea | undefined {
  const out: PlotArea = {
    plots: [],
    axes: [],
  };

  for (const child of element.children) {
    if (child.tagName === 'layout') {
      // Manual plot-area placement (c:manualLayout, incl. layoutTarget inner/outer).
      addProp(out, 'layout', readLayout(child));
    }
    else if (child.tagName === 'spPr') {
      addProp(out, 'shape', readShapeProperties(child, context));
    }
    else if (child.tagName === 'dTable') {
      out.dTable = readDTable(child, context);
    }
    else if (child.tagName in PLOT_HANDLER) {
      const plot = readPlot(child, context);
      if (plot) { out.plots.push(plot); }
    }
    else if (child.tagName in AXIS_NAMES) {
      const axis = readAxis(child, context);
      if (axis) { out.axes.push(axis); }
    }
  }

  return out;
}
