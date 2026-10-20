import type {
  Chart,
  ChartAxis,
  ChartBinning,
  ChartDataLabel,
  ChartDataLabelContent,
  ChartDataLabels,
  ChartDataPoint,
  ChartFieldBinding,
  ChartLegend,
  ChartMark,
  ChartPlot,
  ChartPlotLayout,
  ChartScale,
  ChartSeries,
  ChartTransform,
} from '@jsfkit/types';
import { reduceOverrides } from './overrides.ts';
import { reduceShapes } from './shapeDefaults.ts';
import { applyTextCascade, CHARTEX_TEXT_FALLBACKS } from './textCascade.ts';
import type { ConversionContext } from '../../ConversionContext.ts';
import { MISSING_CHART_CHARTEX } from '../../constants.ts';
import { addProp } from '../../utils/addProp.ts';
import { hasKeys } from '../../utils/hasKeys.ts';
import { BUILT_IN_UNITS } from './displayUnits.ts';
import {
  DATASET_ID,
  LABEL_POSITIONS,
  TICK_MARKS,
  convertGridlines,
  convertNumFmt,
  convertShape,
  convertText,
  convertTextStyle,
  convertTitle,
  dropDefaultColorIndex,
  dropDefaultSeriesOrder,
  fieldEncoding,
  hoistSharedBindings,
  inferLevels,
  plotLayout,
  pointMap,
  toValue,
  type LayoutSettings,
} from './convertShared.ts';
import type { ChartExDim } from './readChartData.ts';
import type { ChartSpaceEx } from './types/ChartSpaceEx.ts';
import type { AxisEx } from './types/axes/AxisEx.ts';
import type { SeriesEx } from './types/seriesEx/SeriesEx.ts';
import type { DataLabel } from './types/seriesEx/DataLabel.ts';
import type { DataLabels } from './types/seriesEx/DataLabels.ts';

const SIDES = { t: 'top', b: 'bottom', l: 'left', r: 'right' } as const;

/**
 * How each ChartEx series layout converts: the plot's mark, and the transform that derives its
 * data, if any. `paretoLine` series are handled with the plot of the series that owns them, and
 * `regionMap` isn't converted.
 */
const LAYOUTS: Record<string, { mark: ChartMark, transform?: ChartTransform['type'] }> = {
  clusteredColumn: { mark: 'bar', transform: 'bin' },
  boxWhisker: { mark: 'boxplot', transform: 'boxplot' },
  waterfall: { mark: 'waterfall', transform: 'waterfall' },
  treemap: { mark: 'treemap', transform: 'hierarchy' },
  sunburst: { mark: 'sunburst', transform: 'hierarchy' },
  funnel: { mark: 'funnel' },
};

/** ChartEx gap widths are ratios (2.19 means 219%). JSFChart uses integer percentages. */
function gapPercent (gapWidth: 'auto' | number | undefined): number | undefined {
  return typeof gapWidth === 'number' ? Math.round(gapWidth * 100) : undefined;
}

function numberOrUndefined (v: 'auto' | number | undefined): number | undefined {
  return typeof v === 'number' ? v : undefined;
}

function convertLabelShared (target: ChartDataLabels, src: DataLabel | DataLabels) {
  if (src.visibility) {
    const show: ChartDataLabelContent[] = [];
    if (src.visibility.value) { show.push('value'); }
    if (src.visibility.categoryName) { show.push('category'); }
    if (src.visibility.seriesName) { show.push('series'); }
    target.show = show;
  }
  if (src.pos) {
    addProp(target, 'position', LABEL_POSITIONS[src.pos]);
  }
  addProp(target, 'separator', src.separator, ', ');
  convertNumFmt(target, src.numFmt);
  addProp(target, 'shape', convertShape(src.shape));
  addProp(target, 'textStyle', convertTextStyle(src.textProps));
}

class ChartExBuilder {
  cs: ChartSpaceEx;
  scales: ChartScale[] = [];
  axes: ChartAxis[] = [];
  transforms: ChartTransform[] = [];
  datasetBindings: Record<string, ChartFieldBinding> = {};
  /** Scale ID for each native axis ID. */
  scaleByAxis = new Map<number, string>();
  /** The category axis's gap width, as a percentage. */
  gapWidth?: number;
  /** Series keys, by document position. */
  keys: string[] = [];

  constructor (cs: ChartSpaceEx) {
    this.cs = cs;
  }

  buildAxes (axes: AxisEx[], horizontalCategories: boolean) {
    let valueCount = 0;
    for (const axis of axes) {
      const isCategory = axis.scaling.type === 'cat';
      const scaleId = isCategory ? 'category' : (valueCount++ === 0 ? 'value' : 'value2');
      this.scaleByAxis.set(axis.id, scaleId);

      if (axis.scaling.type === 'cat') {
        this.scales.push({ id: scaleId, type: 'band' });
        this.gapWidth ??= gapPercent(axis.scaling.gapWidth);
      }
      else {
        const scale: ChartScale = { id: scaleId, type: 'linear' };
        addProp(scale, 'min', numberOrUndefined(axis.scaling.min));
        addProp(scale, 'max', numberOrUndefined(axis.scaling.max));
        addProp(scale, 'majorUnit', numberOrUndefined(axis.scaling.majorUnit));
        addProp(scale, 'minorUnit', numberOrUndefined(axis.scaling.minorUnit));
        this.scales.push(scale);
      }

      // ChartEx doesn't store axis positions: categories run along the bottom (down the left side
      // in a funnel), the first value axis is on the left, and a second one on the right.
      let orient: ChartAxis['orient'] = 'left';
      if (isCategory) { orient = horizontalCategories ? 'left' : 'bottom'; }
      else if (scaleId === 'value2') { orient = 'right'; }

      const out: ChartAxis = { id: scaleId + 'Axis', scale: scaleId, orient };
      addProp(out, 'hidden', axis.hidden, false);
      addProp(out, 'title', convertTitle(axis.title));
      // Without cx:majorTickMarks there are no tick marks, unlike JSFChart's default.
      const tickMarks: NonNullable<ChartAxis['tickMarks']> = {};
      addProp(tickMarks, 'major', axis.majorTickMarks ? TICK_MARKS[axis.majorTickMarks] : 'none', 'outside');
      if (axis.minorTickMarks) {
        addProp(tickMarks, 'minor', TICK_MARKS[axis.minorTickMarks], 'none');
      }
      addProp(out, 'tickMarks', hasKeys(tickMarks) ? tickMarks : undefined);
      if (!axis.tickLabels) {
        out.tickLabels = { position: 'none' };
      }
      addProp(out, 'gridlines', convertGridlines(axis.majorGridlines, axis.minorGridlines));
      convertNumFmt(out, axis.numFmt);
      if (axis.units?.unit) {
        // ChartEx spells the percent unit `percentage`
        out.displayUnits = axis.units.unit === 'percentage' ? 'percent' : BUILT_IN_UNITS[axis.units.unit];
      }
      addProp(out, 'displayUnitsLabel', convertTitle(axis.units?.unitsLabel));
      addProp(out, 'shape', convertShape(axis.shape));
      addProp(out, 'textStyle', convertTextStyle(axis.textProps));
      this.axes.push(out);
    }
  }

  /** A binding for a data dimension, or undefined if it has neither a formula nor values. */
  makeBinding (dim: ChartExDim, role: ChartFieldBinding['role']): ChartFieldBinding | undefined {
    const binding: ChartFieldBinding = {};
    addProp(binding, 'formula', dim.f);
    if (!dim.f && dim.values) {
      binding.values = dim.values.map(v => (v == null ? null : toValue(v, dim.numeric)));
    }
    addProp(binding, 'role', role);
    addProp(binding, 'numberFormat', dim.formatCode, 'General');
    return hasKeys(binding) ? binding : undefined;
  }

  /** The number of category levels in the chart's first series. */
  categoryLevels (series: SeriesEx[]): number {
    const dim = series[0]?.dataId != null ? this.cs.data.get(series[0].dataId)?.cat : undefined;
    return dim?.levels ?? (dim?.f ? inferLevels(dim.f).levels : undefined) ?? 1;
  }

  buildSeries (ser: SeriesEx, position: number): ChartSeries {
    // The series key defaults to its ID, so it isn't written.
    const out: ChartSeries = { id: this.keys[position] };
    addProp(out, 'name', convertText(ser.text));
    addProp(out, 'colorIndex', ser.formatIdx);
    out.order = position;

    const data = ser.dataId != null ? this.cs.data.get(ser.dataId) : undefined;
    const bindings: Record<string, ChartFieldBinding> = {};
    if (data?.cat) {
      const binding = this.makeBinding(data.cat, 'category');
      if (binding) {
        const inferred = data.cat.f ? inferLevels(data.cat.f) : {};
        const levels = data.cat.levels ?? inferred.levels ?? 1;
        if (levels > 1) {
          binding.level = 0;
          if (data.cat.f) {
            // The levels share one range, with a column (or row) per level.
            const direction = data.cat.dir === 'row' ? 'row' : data.cat.dir === 'col' ? 'column' : inferred.direction;
            addProp(binding, 'direction', direction, 'column');
          }
          for (let level = 1; level < levels; level++) {
            const levelBinding: ChartFieldBinding = { ...binding, level };
            const literal = data.cat.levelValues?.[level];
            if (literal) {
              // Literal data has its own values for each level.
              levelBinding.values = literal.map(v => (v == null ? null : toValue(v, false)));
            }
            bindings[`category${level}`] = levelBinding;
          }
        }
        bindings.category = binding;
      }
    }
    if (data?.val) {
      addProp(bindings, 'value', this.makeBinding(data.val, 'value'));
    }
    if (data?.size) {
      addProp(bindings, 'size', this.makeBinding(data.size, 'size'));
    }
    addProp(out, 'bindings', hasKeys(bindings) ? bindings : undefined);

    addProp(out, 'shape', convertShape(ser.shape));
    if (ser.dataLabels) {
      const labels: ChartDataLabels = {};
      convertLabelShared(labels, ser.dataLabels);
      out.labels = labels;
    }
    addProp(out, 'points', this.buildPoints(ser));
    addProp(out, 'hidden', ser.hidden, false);
    return out;
  }

  buildPoints (ser: SeriesEx): ChartDataPoint[] | undefined {
    const { points, point } = pointMap();
    for (const dp of ser.dataPt ?? []) {
      addProp(point(dp.idx), 'shape', convertShape(dp.shape));
    }
    for (const dl of ser.dataLabels?.dataLabel ?? []) {
      const label: ChartDataLabel = {};
      convertLabelShared(label, dl);
      point(dl.idx).label = label;
    }
    for (const idx of ser.dataLabels?.dataLabelHidden ?? []) {
      point(idx).label = { ...point(idx).label, hidden: true };
    }
    const list = [ ...points.values() ].filter(p => Object.keys(p).length > 1);
    return list.length ? list.sort((a, b) => a.index - b.index) : undefined;
  }

  /** The value scale a series is on, from its axis IDs. */
  valueScaleOf (ser: SeriesEx | undefined): string | undefined {
    for (const id of ser?.axisId ?? []) {
      const scale = this.scaleByAxis.get(id);
      if (scale && scale !== 'category') { return scale; }
    }
    return this.scales.find(s => s.id === 'value') ? 'value' : undefined;
  }
}

function convertLegend (cs: ChartSpaceEx): ChartLegend | undefined {
  const legend = cs.chart.legend;
  if (!legend) { return; }
  const out: ChartLegend = {};
  if (legend.pos) { addProp(out, 'position', SIDES[legend.pos], 'right'); }
  // `align` isn't kept: Excel only offers centered titles and legends, apart from region maps
  addProp(out, 'overlay', legend.overlay, false);
  addProp(out, 'shape', convertShape(legend.shape));
  addProp(out, 'textStyle', convertTextStyle(legend.textProps));
  return out;
}

function convertBinning (ser: SeriesEx | undefined): ChartBinning {
  const layoutPr = ser?.layoutPr;
  if (layoutPr?.aggregation) {
    return { type: 'category', categoryField: 'category' };
  }
  const src = layoutPr?.binning;
  let binning: ChartBinning = { type: 'auto' };
  if (src?.binSize != null) { binning = { type: 'width', width: src.binSize }; }
  else if (src?.binCount != null) { binning = { type: 'count', count: src.binCount }; }
  if (src) {
    addProp(binning, 'overflow', src.overflow);
    addProp(binning, 'underflow', src.underflow);
    if (src.intervalClosed) {
      addProp(binning, 'intervalClosed', src.intervalClosed === 'l' ? 'left' : 'right', 'right');
    }
  }
  return binning;
}

/** What a plot builder needs: the plot to fill in, and the series and settings it's built from. */
type PlotContext = {
  builder: ChartExBuilder;
  cs: ChartSpaceEx;
  /** The plot to fill in. */
  plot: ChartPlot;
  /** The plot's number, for its ID and its transform's ID. */
  n: number;
  /** The plot's series, with their positions among all of the chart's series. */
  members: { s: SeriesEx, position: number }[];
  /** The series that per-series settings come from: the first visible one (spec section 5.0). */
  lead: SeriesEx;
  allSeries: SeriesEx[];
  scales: { category: string, value: string | undefined };
};

/**
 * A histogram or Pareto chart: bars over bins of the values. A Pareto chart also gets a second plot,
 * the cumulative line, which is returned as `paretoPlot`.
 */
function buildBinPlot ({ builder, plot, n, members, lead, allSeries, scales }: PlotContext) {
  const paretoLines = allSeries
    .map((s, position) => ({ s, position }))
    .filter(({ s }) => s.layoutId === 'paretoLine' && members.some(m => m.position === s.ownerIdx));
  const bin: ChartTransform = {
    id: 'bins' + n,
    type: 'bin',
    source: DATASET_ID,
    field: 'value',
    groupBy: [ 'series' ],
    binning: convertBinning(lead),
    as: { start: 'binStart', end: 'binEnd', count: 'count' },
  };
  if (paretoLines.length) { bin.as.cumulative = 'cumulative'; }
  builder.transforms.push(bin);
  plot.data = bin.id;
  plot.encoding.x = fieldEncoding('binStart', scales.category);
  plot.encoding.x2 = { field: 'binEnd' };
  plot.encoding.y = fieldEncoding('count', scales.value);
  const layout = plotLayout('bar', builder.gapWidth != null && builder.gapWidth !== 150 ? { gapWidth: builder.gapWidth } : undefined);

  let paretoPlot: ChartPlot | undefined;
  if (paretoLines.length) {
    // The Pareto line is a second plot over the same bins, on the percentage axis.
    const lineScale = builder.valueScaleOf(paretoLines[0].s);
    paretoPlot = {
      id: 'plot' + n + 'Pareto',
      mark: 'line',
      data: bin.id,
      axisGroup: 'secondary',
      encoding: {
        series: { field: 'series' },
        x: fieldEncoding('binStart', scales.category),
        y: fieldEncoding('cumulative', lineScale),
      },
      series: paretoLines.map(({ s, position }) => {
        const out: ChartSeries = { id: builder.keys[position], key: builder.keys[s.ownerIdx!] };
        addProp(out, 'colorIndex', s.formatIdx);
        out.order = position;
        addProp(out, 'shape', convertShape(s.shape));
        addProp(out, 'hidden', allSeries[s.ownerIdx!]?.hidden, false);
        return out;
      }),
    };
  }
  return { layout, paretoPlot };
}

/** A box and whisker chart: statistics of each category's values. */
function buildBoxplotPlot ({ builder, plot, n, lead, scales }: PlotContext): ChartPlotLayout | undefined {
  const box: ChartTransform = {
    id: 'boxplot' + n,
    type: 'boxplot',
    source: DATASET_ID,
    field: 'value',
    groupBy: [ 'series', 'category' ],
  };
  addProp(box, 'quartileMethod', lead.layoutPr?.statistics?.quartileMethod, 'exclusive');
  builder.transforms.push(box);
  plot.data = box.id;
  plot.encoding.x = fieldEncoding('category', scales.category);
  plot.encoding.y = fieldEncoding('value', scales.value);
  const v = lead.layoutPr?.visibility;
  const boxplot: LayoutSettings<'boxplot'> = {};
  addProp(boxplot, 'gapWidth', builder.gapWidth, 150);
  addProp(boxplot, 'showMeanMarkers', v?.meanMarker, true);
  addProp(boxplot, 'showMeanLine', v?.meanLine, false);
  addProp(boxplot, 'showInnerPoints', v?.nonoutliers, false);
  addProp(boxplot, 'showOutliers', v?.outliers, true);
  return plotLayout('boxplot', boxplot);
}

/** A waterfall chart: running totals of the values, with some points as totals. */
function buildWaterfallPlot ({ builder, cs, plot, n, lead, scales }: PlotContext): ChartPlotLayout | undefined {
  const wf: ChartTransform = {
    id: 'waterfall' + n,
    type: 'waterfall',
    source: DATASET_ID,
    field: 'value',
    categoryField: 'category',
    groupBy: [ 'series' ],
    as: { start: 'start', end: 'end' },
  };
  const subtotals = lead.layoutPr?.subtotals?.idx;
  addProp(wf, 'subtotals', subtotals?.length ? subtotals : undefined);
  builder.transforms.push(wf);
  plot.data = wf.id;
  plot.encoding.x = fieldEncoding('category', scales.category);
  plot.encoding.y = fieldEncoding('value', scales.value);
  const waterfall: LayoutSettings<'waterfall'> = {};
  addProp(waterfall, 'gapWidth', builder.gapWidth, 150);
  // Excel draws connector lines when cx:visibility doesn't say otherwise, but JSFChart's
  // default is off, so an absent setting is written as on.
  addProp(waterfall, 'showConnectorLines', lead.layoutPr?.visibility?.connectorLines ?? true, false);
  // The Increase, Decrease, and Total columns aren't elements of their own, so Excel keeps
  // their colors in cx:fmtOvrs, in format slots 0, 1, and 2 (confirmed for single-series
  // waterfalls).
  const slot = (idx: number) => convertShape(cs.fmtOvrs?.find(f => f.idx === idx)?.shape);
  addProp(waterfall, 'increase', slot(0));
  addProp(waterfall, 'decrease', slot(1));
  addProp(waterfall, 'total', slot(2));
  return plotLayout('waterfall', waterfall);
}

/** A treemap or sunburst chart: the values arranged by their category levels. */
function buildHierarchyPlot ({ builder, plot, n, members, lead }: PlotContext): ChartPlotLayout | undefined {
  const levels = builder.categoryLevels(members.map(m => m.s));
  const levelFields = Array.from({ length: levels }, (_, i) => (i === levels - 1 ? 'category' : `category${levels - 1 - i}`));
  const hierarchy: ChartTransform = {
    id: 'hierarchy' + n,
    type: 'hierarchy',
    source: DATASET_ID,
    levels: levelFields,
    valueField: 'size',
  };
  builder.transforms.push(hierarchy);
  plot.data = hierarchy.id;
  if (plot.mark === 'treemap') {
    const parentLabelLayout = lead.layoutPr?.parentLabelLayout;
    return plotLayout('treemap', parentLabelLayout && parentLabelLayout !== 'overlapping' ? { parentLabelLayout } : undefined);
  }
  return undefined;
}

/** A funnel chart: bars for the values, with the categories down the left side. */
function buildFunnelPlot ({ builder, plot, scales }: PlotContext): ChartPlotLayout | undefined {
  plot.encoding.y = fieldEncoding('category', scales.category);
  plot.encoding.x = { field: 'value' };
  return plotLayout('funnel', builder.gapWidth != null && builder.gapWidth !== 150 ? { gapWidth: builder.gapWidth } : undefined);
}

/**
 * Convert a parsed ChartEx chart (`cx:chartSpace`) into a JSF chart.
 *
 * A chart with a series layout that isn't converted yet (such as `regionMap`) is left out
 * entirely, and reported with the `chart-chartex` unsupported tag.
 */
export function convertChartSpaceEx (cs: ChartSpaceEx, context: ConversionContext): Chart | undefined {
  const plotArea = cs.chart.plotArea;
  const allSeries = plotArea?.series ?? [];
  if (!allSeries.length || allSeries.some(s => s.layoutId !== 'paretoLine' && !LAYOUTS[s.layoutId])) {
    context.unsupported.add(MISSING_CHART_CHARTEX);
    return;
  }

  const builder = new ChartExBuilder(cs);
  builder.keys = allSeries.map((_, i) => 's' + i);
  builder.buildAxes(plotArea!.axes, allSeries.some(s => s.layoutId === 'funnel'));

  // One plot per layout, in the order the layouts first appear. Pareto lines join the plot of the
  // series that owns them.
  const layoutOrder: string[] = [];
  for (const s of allSeries) {
    if (s.layoutId !== 'paretoLine' && !layoutOrder.includes(s.layoutId)) {
      layoutOrder.push(s.layoutId);
    }
  }

  const plots: ChartPlot[] = [];
  for (const layoutId of layoutOrder) {
    const { mark, transform } = LAYOUTS[layoutId];
    const members = allSeries
      .map((s, position) => ({ s, position }))
      .filter(({ s }) => s.layoutId === layoutId);
    // Per-series settings come from the first visible series (spec section 5.0).
    const lead = (members.find(({ s }) => !s.hidden) ?? members[0]).s;
    const scales = { category: 'category', value: builder.valueScaleOf(lead) };
    const n = plots.length + 1;
    let layout: ChartPlotLayout | undefined;
    let paretoPlot: ChartPlot | undefined;
    const plot: ChartPlot = {
      id: 'plot' + n,
      mark,
      data: DATASET_ID,
      encoding: { series: { field: 'series' } },
      series: [],
    };

    const ctx: PlotContext = { builder, cs, plot, n, members, lead, allSeries, scales };
    if (transform === 'bin') {
      ({ layout, paretoPlot } = buildBinPlot(ctx));
    }
    else if (transform === 'boxplot') {
      layout = buildBoxplotPlot(ctx);
    }
    else if (transform === 'waterfall') {
      layout = buildWaterfallPlot(ctx);
    }
    else if (transform === 'hierarchy') {
      layout = buildHierarchyPlot(ctx);
    }
    else if (mark === 'funnel') {
      layout = buildFunnelPlot(ctx);
    }

    plot.series = members.map(({ s, position }) => builder.buildSeries(s, position));
    addProp(plot, 'layout', layout);
    plots.push(plot);
    if (paretoPlot) { plots.push(paretoPlot); }
  }

  hoistSharedBindings(plots, builder.datasetBindings);
  const dataset: Chart['data'][number] = { id: DATASET_ID };
  addProp(dataset, 'bindings', hasKeys(builder.datasetBindings) ? builder.datasetBindings : undefined);

  const chart: Chart = { data: [ dataset ], scales: builder.scales, plots };
  // a title's `pos` and `align` aren't kept: Excel's UI always puts it at the top center
  addProp(chart, 'title', convertTitle(cs.chart.title));
  addProp(chart, 'transforms', builder.transforms.length ? builder.transforms : undefined);
  addProp(chart, 'axes', builder.axes.length ? builder.axes : undefined);
  addProp(chart, 'legend', convertLegend(cs));
  addProp(chart, 'shape', convertShape(cs.shape));
  // Chart-wide text properties (cx:txPr) aren't kept: ChartEx elements don't inherit them in
  // Excel (confirmed), so they have no effect.
  const plotAreaShape = convertShape(plotArea?.plotSurface ?? plotArea?.shape);
  addProp(chart, 'plotArea', plotAreaShape ? { shape: plotAreaShape } : undefined);
  applyTextCascade(chart, CHARTEX_TEXT_FALLBACKS);
  reduceOverrides(chart);
  reduceShapes(chart);
  dropDefaultColorIndex(chart.plots);
  dropDefaultSeriesOrder(chart.plots);
  return chart;
}
