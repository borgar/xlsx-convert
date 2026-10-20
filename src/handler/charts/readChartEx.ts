import type { Element } from '@borgar/simple-xml';
import type { Shape } from '@jsfkit/types';
import type { ConversionContext } from '../../ConversionContext.ts';
import { addProp } from '../../utils/addProp.ts';
import { attr, boolAttr, numAttr } from '../../utils/attr.ts';
import { getFirstChild } from '../../utils/getFirstChild.ts';
import { hasKeys } from '../../utils/hasKeys.ts';
import { readShapeProperties } from '../drawings/readShapeProperties.ts';
import { readChartData, type ChartDataMap } from './readChartData.ts';
import { readNumFmt } from './readNumFmt.ts';
import { readText } from './readText.ts';
import { readTextProps } from './readTextProps.ts';
import type { ChartSpaceEx } from './types/ChartSpaceEx.ts';
import type { ChartEx, TitleEx } from './types/ChartEx.ts';
import type { PlotAreaEx } from './types/PlotAreaEx.ts';
import type { AxisEx, AxisTitle, AxisUnits } from './types/axes/AxisEx.ts';
import type { TickMark } from './types/axes/TickMark.ts';
import type { LegendEx } from './types/legend/LegendEx.ts';
import type { SeriesEx } from './types/seriesEx/SeriesEx.ts';
import type { SeriesLayout } from './types/seriesEx/SeriesLayout.ts';
import type { SeriesLayoutProperties } from './types/seriesEx/SeriesLayoutProperties.ts';
import type { SeriesElementVisibilities } from './types/seriesEx/SeriesElementVisibilities.ts';
import type { Binning } from './types/seriesEx/Binning.ts';
import type { DataLabels } from './types/seriesEx/DataLabels.ts';
import type { DataLabel } from './types/seriesEx/DataLabel.ts';
import type { DataLabelPos } from './types/seriesEx/DataLabelPos.ts';
import type { DataPoint } from './types/seriesEx/DataPoint.ts';
import type { TextProps } from './types/TextProps.ts';

function children (elm: Element, tagName: string): Element[] {
  return elm.children.filter(d => d.tagName === tagName);
}

function valAttr (elm: Element | undefined): string | undefined {
  return elm ? (attr(elm, 'val') ?? undefined) : undefined;
}

function numValAttr (elm: Element | undefined): number | undefined {
  return elm ? (numAttr(elm, 'val') ?? undefined) : undefined;
}

/** A number attribute that can also be `auto`. */
function autoOrNumber (elm: Element, name: string): 'auto' | number | undefined {
  const v = attr(elm, name);
  if (v == null) { return; }
  return v === 'auto' ? 'auto' : Number(v);
}

function readShape (elm: Element, context: ConversionContext): Shape | undefined {
  const spPr = getFirstChild(elm, 'spPr');
  return spPr ? readShapeProperties(spPr, context) : undefined;
}

/**
 * Read the text, shape, and text properties that titles and labels share. Text styling usually
 * lives on the rich text block, and a later `txPr` overrides it.
 */
function readTextBlock (elm: Element, context: ConversionContext) {
  const out: { text?: ReturnType<typeof readText>, shape?: Shape, textProps?: TextProps } = {};
  const tx = getFirstChild(elm, 'tx');
  if (tx) {
    addProp(out, 'text', readText(tx, context));
    const rich = getFirstChild(tx, 'rich');
    if (rich) { addProp(out, 'textProps', readTextProps(rich, context)); }
  }
  addProp(out, 'shape', readShape(elm, context));
  const txPr = getFirstChild(elm, 'txPr');
  if (txPr) { addProp(out, 'textProps', readTextProps(txPr, context)); }
  return out;
}

function readTitle (elm: Element, context: ConversionContext): TitleEx {
  const out: TitleEx = readTextBlock(elm, context);
  addProp(out, 'pos', attr(elm, 'pos') as TitleEx['pos'] | null);
  addProp(out, 'align', attr(elm, 'align') as TitleEx['align'] | null);
  addProp(out, 'overlay', boolAttr(elm, 'overlay'));
  return out;
}

function readLegend (elm: Element, context: ConversionContext): LegendEx {
  const out: LegendEx = {};
  addProp(out, 'pos', attr(elm, 'pos') as LegendEx['pos'] | null);
  addProp(out, 'align', attr(elm, 'align') as LegendEx['align'] | null);
  addProp(out, 'overlay', boolAttr(elm, 'overlay'));
  addProp(out, 'shape', readShape(elm, context));
  const txPr = getFirstChild(elm, 'txPr');
  if (txPr) { addProp(out, 'textProps', readTextProps(txPr, context)); }
  return out;
}

function readDataLabelShared (elm: Element, context: ConversionContext, out: DataLabel | DataLabels) {
  addProp(out, 'pos', attr(elm, 'pos') as DataLabelPos | null);
  for (const child of elm.children) {
    if (child.tagName === 'numFmt') {
      addProp(out, 'numFmt', readNumFmt(child));
    }
    else if (child.tagName === 'spPr') {
      addProp(out, 'shape', readShapeProperties(child, context));
    }
    else if (child.tagName === 'txPr') {
      addProp(out, 'textProps', readTextProps(child, context));
    }
    else if (child.tagName === 'visibility') {
      const visibility: DataLabels['visibility'] = {};
      addProp(visibility, 'seriesName', boolAttr(child, 'seriesName'));
      addProp(visibility, 'categoryName', boolAttr(child, 'categoryName'));
      addProp(visibility, 'value', boolAttr(child, 'value'));
      out.visibility = visibility;
    }
    else if (child.tagName === 'separator') {
      out.separator = child.textContent ?? '';
    }
  }
}

function readDataLabels (elm: Element, context: ConversionContext): DataLabels {
  const out: DataLabels = {};
  readDataLabelShared(elm, context, out);
  // a label or point without an idx can't be matched to a point, so it's left out
  const labels = children(elm, 'dataLabel').flatMap(d => {
    const idx = numAttr(d, 'idx');
    if (idx == null) { return []; }
    const label: DataLabel = { idx };
    readDataLabelShared(d, context, label);
    return [ label ];
  });
  if (labels.length) { out.dataLabel = labels; }
  const hidden = children(elm, 'dataLabelHidden')
    .map(d => numAttr(d, 'idx'))
    .filter((d): d is number => d != null);
  if (hidden.length) { out.dataLabelHidden = hidden; }
  return out;
}

function readLayoutPr (elm: Element): SeriesLayoutProperties {
  const out: SeriesLayoutProperties = {};
  for (const child of elm.children) {
    if (child.tagName === 'parentLabelLayout') {
      addProp(out, 'parentLabelLayout', valAttr(child) as SeriesLayoutProperties['parentLabelLayout']);
    }
    else if (child.tagName === 'visibility') {
      const visibility: SeriesElementVisibilities = {};
      for (const name of [ 'connectorLines', 'meanLine', 'meanMarker', 'nonoutliers', 'outliers' ] as const) {
        addProp(visibility, name, boolAttr(child, name));
      }
      out.visibility = visibility;
    }
    else if (child.tagName === 'aggregation') {
      out.aggregation = { type: 'aggregation' };
    }
    else if (child.tagName === 'binning') {
      const binning: Binning = { type: 'binning' };
      addProp(binning, 'intervalClosed', attr(child, 'intervalClosed') as Binning['intervalClosed'] | null);
      addProp(binning, 'underflow', autoOrNumber(child, 'underflow'));
      addProp(binning, 'overflow', autoOrNumber(child, 'overflow'));
      addProp(binning, 'binSize', numValAttr(getFirstChild(child, 'binSize')));
      addProp(binning, 'binCount', numValAttr(getFirstChild(child, 'binCount')));
      out.binning = binning;
    }
    else if (child.tagName === 'statistics') {
      const method = attr(child, 'quartileMethod');
      if (method === 'inclusive' || method === 'exclusive') {
        out.statistics = { quartileMethod: method };
      }
    }
    else if (child.tagName === 'subtotals') {
      const idx = children(child, 'idx')
        .map(d => numValAttr(d))
        .filter((d): d is number => d != null);
      out.subtotals = idx.length ? { idx } : {};
    }
  }
  return out;
}

function readSeries (elm: Element, context: ConversionContext): SeriesEx {
  const out: SeriesEx = { layoutId: (attr(elm, 'layoutId') ?? '') as SeriesLayout };
  addProp(out, 'hidden', boolAttr(elm, 'hidden'), false);
  addProp(out, 'ownerIdx', numAttr(elm, 'ownerIdx'));
  addProp(out, 'formatIdx', numAttr(elm, 'formatIdx'));
  for (const child of elm.children) {
    if (child.tagName === 'tx') {
      addProp(out, 'text', readText(child, context));
    }
    else if (child.tagName === 'spPr') {
      addProp(out, 'shape', readShapeProperties(child, context));
    }
    else if (child.tagName === 'dataPt') {
      const idx = numAttr(child, 'idx');
      if (idx != null) {
        const point: DataPoint = { idx };
        addProp(point, 'shape', readShape(child, context));
        (out.dataPt ??= []).push(point);
      }
    }
    else if (child.tagName === 'dataLabels') {
      out.dataLabels = readDataLabels(child, context);
    }
    else if (child.tagName === 'dataId') {
      addProp(out, 'dataId', numValAttr(child));
    }
    else if (child.tagName === 'layoutPr') {
      out.layoutPr = readLayoutPr(child);
    }
    else if (child.tagName === 'axisId') {
      const id = numValAttr(child);
      if (id != null) { (out.axisId ??= []).push(id); }
    }
  }
  return out;
}

function readAxis (elm: Element, context: ConversionContext): AxisEx {
  const out: AxisEx = { id: numAttr(elm, 'id', 0) ?? 0, scaling: { type: 'cat' } };
  addProp(out, 'hidden', boolAttr(elm, 'hidden'), false);
  for (const child of elm.children) {
    if (child.tagName === 'catScaling') {
      out.scaling = { type: 'cat' };
      addProp(out.scaling, 'gapWidth', autoOrNumber(child, 'gapWidth'));
    }
    else if (child.tagName === 'valScaling') {
      out.scaling = { type: 'val' };
      for (const name of [ 'max', 'min', 'majorUnit', 'minorUnit' ] as const) {
        addProp(out.scaling, name, autoOrNumber(child, name));
      }
    }
    else if (child.tagName === 'title') {
      out.title = readTextBlock(child, context) as AxisTitle;
    }
    else if (child.tagName === 'units') {
      const units: AxisUnits = {};
      addProp(units, 'unit', attr(child, 'unit') as AxisUnits['unit'] | null);
      const label = getFirstChild(child, 'unitsLabel');
      if (label) { units.unitsLabel = readTextBlock(label, context); }
      out.units = units;
    }
    else if (child.tagName === 'majorGridlines') {
      out.majorGridlines = readShape(child, context) ?? {};
    }
    else if (child.tagName === 'minorGridlines') {
      out.minorGridlines = readShape(child, context) ?? {};
    }
    else if (child.tagName === 'majorTickMarks') {
      addProp(out, 'majorTickMarks', attr(child, 'type') as TickMark | null);
    }
    else if (child.tagName === 'minorTickMarks') {
      addProp(out, 'minorTickMarks', attr(child, 'type') as TickMark | null);
    }
    else if (child.tagName === 'tickLabels') {
      out.tickLabels = true;
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
  }
  return out;
}

function readPlotArea (elm: Element, context: ConversionContext): PlotAreaEx {
  const out: PlotAreaEx = { series: [], axes: [] };
  for (const child of elm.children) {
    if (child.tagName === 'plotAreaRegion') {
      const surface = getFirstChild(child, 'plotSurface');
      if (surface) { addProp(out, 'plotSurface', readShape(surface, context)); }
      out.series = children(child, 'series').map(s => readSeries(s, context));
    }
    else if (child.tagName === 'axis') {
      out.axes.push(readAxis(child, context));
    }
    else if (child.tagName === 'spPr') {
      addProp(out, 'shape', readShapeProperties(child, context));
    }
  }
  return out;
}

function readChart (elm: Element, context: ConversionContext): ChartEx {
  const out: ChartEx = {};
  for (const child of elm.children) {
    if (child.tagName === 'title') {
      out.title = readTitle(child, context);
    }
    else if (child.tagName === 'plotArea') {
      out.plotArea = readPlotArea(child, context);
    }
    else if (child.tagName === 'legend') {
      out.legend = readLegend(child, context);
    }
  }
  return out;
}

/**
 * Read a ChartEx chart space (`cx:chartSpace`).
 */
export function readChartEx (root: Element, context: ConversionContext): ChartSpaceEx {
  let data: ChartDataMap = new Map();
  let chart: ChartEx = {};
  const out: Omit<ChartSpaceEx, 'data' | 'chart'> = {};
  for (const child of root.children) {
    if (child.tagName === 'chartData') {
      data = readChartData(child, context);
    }
    else if (child.tagName === 'chart') {
      chart = readChart(child, context);
    }
    else if (child.tagName === 'spPr') {
      addProp(out, 'shape', readShapeProperties(child, context));
    }
    else if (child.tagName === 'txPr') {
      addProp(out, 'textProps', readTextProps(child, context));
    }
    else if (child.tagName === 'fmtOvrs') {
      const fmtOvrs = children(child, 'fmtOvr').flatMap(d => {
        const idx = numAttr(d, 'idx');
        const shape = readShape(d, context);
        return idx != null && shape ? [ { idx, shape } ] : [];
      });
      if (fmtOvrs.length) { out.fmtOvrs = fmtOvrs; }
    }
  }
  return hasKeys(out) ? { data, chart, ...out } : { data, chart };
}
