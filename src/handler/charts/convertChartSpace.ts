import { reduceOverrides } from './overrides.ts';
import { applyShapeFallbacks, LEGACY_SHAPE_FALLBACKS, reduceShapes } from './shapeDefaults.ts';
import { legendEntryList, legendEntryRef } from './legendEntries.ts';
import { applyTextCascade, LEGACY_TEXT_FALLBACKS } from './textCascade.ts';
import type {
  Chart,
  ChartAxis,
  ChartAxisCrossing,
  ChartScaleBand,
  ChartDataLabel,
  ChartDataLabelContent,
  ChartDataLabels,
  ChartDataPoint,
  ChartEncoding,
  ChartErrorBars,
  ChartFieldBinding,
  ChartFilteredPoint,
  ChartLegend,
  ChartMarker,
  ChartPictureOptions,
  ChartPlot,
  ChartPlotLayout,
  ChartUpDownBars,
  ChartScalePoint,
  ChartScale,
  ChartSeries,
  ChartTrendline,
  ChartValue,
  ChartWall,
  Shape,
} from '@jsfkit/types';
import type { ConversionContext } from '../../ConversionContext.ts';
import { MISSING_CHART } from '../../constants.ts';
import { addProp } from '../../utils/addProp.ts';
import { hasKeys } from '../../utils/hasKeys.ts';
import { BUILT_IN_UNITS } from './displayUnits.ts';
import type { ChartSpace } from './types/ChartSpace.ts';
import {
  DATASET_ID,
  LABEL_POSITIONS,
  TICK_MARKS,
  convertGridlines,
  convertLayout,
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
import type { Axis } from './types/axes/Axis.ts';
import type { AxDataSource } from './types/data/AxDataSource.ts';
import type { NumDataSource } from './types/data/NumDataSource.ts';
import type { DLbl } from './types/datalabels/DLbl.ts';
import type { DLbls } from './types/datalabels/DLbls.ts';
import type { DLblShared } from './types/datalabels/DLblShared.ts';
import type { ErrBars } from './types/errorbars/ErrBars.ts';
import type { Marker } from './types/marker/Marker.ts';
import type { PictureOptions } from './types/plots/PictureOptions.ts';
import type { Plot } from './types/plots/Plot.ts';
import type { Series } from './types/series/Series.ts';
import type { Surface } from './types/3d/Surface.ts';
import type { Trendline } from './types/trendline/Trendline.ts';

const AXIS_ORIENT = { b: 'bottom', l: 'left', r: 'right', t: 'top' } as const;

const LEGEND_POSITIONS = { b: 'bottom', l: 'left', r: 'right', t: 'top', tr: 'topRight' } as const;

const TRENDLINE_TYPES = {
  exp: 'exponential',
  linear: 'linear',
  log: 'logarithmic',
  movingAvg: 'movingAverage',
  poly: 'polynomial',
  power: 'power',
} as const;

const ERROR_VALUE_TYPES = {
  cust: 'custom',
  fixedVal: 'fixed',
  percentage: 'percent',
  stdDev: 'stdDev',
  stdErr: 'stdErr',
} as const;

const SPLIT_TYPES = {
  auto: 'auto',
  cust: 'custom',
  percent: 'percent',
  pos: 'position',
  val: 'value',
} as const;

/**
 * Whether a plot can be converted. A stock plot needs high, low, and close series, and optionally
 * open, so it must have three or four series.
 */
function isConvertiblePlot (plot: Plot): boolean {
  return plot.type !== 'stock' || plot.ser?.length === 3 || plot.ser?.length === 4;
}

/** Plots with an X and a Y value axis, rather than a category axis. */
function isXYPlot (plot: Plot): boolean {
  return plot.type === 'scatter' || plot.type === 'bubble';
}

/** The channel each series of a stock plot feeds, in series order. */
const STOCK_CHANNELS = {
  3: [ 'high', 'low', 'close' ],
  4: [ 'open', 'high', 'low', 'close' ],
} as const;

function isArcPlot (plot: Plot): boolean {
  return plot.type === 'pie' || plot.type === 'pie3d' || plot.type === 'doughnut' || plot.type === 'ofPie';
}

// ---------------------------------------------------------------------------
// Small value converters
// ---------------------------------------------------------------------------

function convertMarker (marker: Marker | undefined): ChartMarker | undefined {
  if (!marker) { return; }
  const out: ChartMarker = {};
  addProp(out, 'symbol', marker.symbol);
  addProp(out, 'size', marker.size);
  addProp(out, 'shape', convertShape(marker.shape));
  return hasKeys(out) ? out : undefined;
}

function convertPictureOptions (opts: PictureOptions | undefined): ChartPictureOptions | undefined {
  return opts && hasKeys(opts) ? { ...opts } : undefined;
}

function convertWall (wall: Surface | undefined): ChartWall | undefined {
  if (!wall) { return; }
  const out: ChartWall = {};
  addProp(out, 'thickness', wall.thickness, 0);
  addProp(out, 'shape', convertShape(wall.shape));
  addProp(out, 'pictureOptions', convertPictureOptions(wall.pictureOptions));
  return out;
}

// ---------------------------------------------------------------------------
// Data sources
// ---------------------------------------------------------------------------

/**
 * Where a series field comes from. References only carry their formula: their cached values
 * aren't read, because chart data is evaluated from the formula. Literal data carries its values.
 */
type SourceValues = {
  formula?: string;
  /** The whole source range, when categories are filtered out. `formula` has the visible cells. */
  fullFormula?: string;
  numberFormat?: string;
  /** Literal values, by point index. */
  values?: ChartValue[];
  /** Literal number formats that differ from `numberFormat`, by point index. */
  pointFormats: Map<number, string>;
};

type CategoryValues = SourceValues & {
  /** For multi-level categories: the number of levels, and which way the values run. */
  levels?: number;
  direction?: 'column' | 'row';
};

function readNumSource (ds: NumDataSource | undefined): SourceValues | undefined {
  if (!ds) { return; }
  if (ds.type === 'numRef') {
    return { formula: ds.f || undefined, fullFormula: ds.fullRef, pointFormats: new Map() };
  }
  const out: SourceValues = { numberFormat: ds.formatCode, values: [], pointFormats: new Map() };
  const count = Math.max(ds.ptCount ?? 0, ...(ds.pt ?? []).map(pt => pt.idx + 1));
  for (let i = 0; i < count; i++) { out.values![i] = null; }
  for (const pt of ds.pt ?? []) {
    out.values![pt.idx] = toValue(pt.v, true, true);
    if (pt.formatCode && pt.formatCode !== out.numberFormat) {
      out.pointFormats.set(pt.idx, pt.formatCode);
    }
  }
  return out;
}

function readAxSource (ds: AxDataSource | undefined): CategoryValues | undefined {
  if (!ds) { return; }
  if (ds.type === 'numRef' || ds.type === 'numData') {
    return readNumSource(ds);
  }
  if (ds.type === 'strData') {
    const count = Math.max(ds.ptCount ?? 0, ...(ds.pt ?? []).map(pt => pt.idx + 1));
    const values: ChartValue[] = Array.from({ length: count }, () => null);
    for (const pt of ds.pt ?? []) { values[pt.idx] = pt.v; }
    return { values, pointFormats: new Map() };
  }
  if (ds.type === 'mlStrRef') {
    // a filtered formula can be a list of ranges, so the levels come from the whole range
    return {
      formula: ds.f || undefined,
      fullFormula: ds.fullRef,
      pointFormats: new Map(),
      ...inferLevels(ds.fullRef ?? ds.f),
    };
  }
  // A series filtered out of the chart has no visible cells, so no formula, only the full range.
  return { formula: ds.f || undefined, fullFormula: ds.fullRef, pointFormats: new Map() };
}

// ---------------------------------------------------------------------------
// Labels, trendlines, error bars
// ---------------------------------------------------------------------------

function convertLabelShared (target: ChartDataLabels, src: DLblShared) {
  const show: ChartDataLabelContent[] = [];
  if (src.showVal) { show.push('value'); }
  if (src.showCatName) { show.push('category'); }
  if (src.showSerName) { show.push('series'); }
  if (src.showPercent) { show.push('percent'); }
  if (src.showBubbleSize) { show.push('bubbleSize'); }
  if (src.showLegendKey) { show.push('legendKey'); }
  if (src.showDataLabelsRange) { show.push('cellRange'); }
  target.show = show;
  if (src.dLblPos) {
    addProp(target, 'position', LABEL_POSITIONS[src.dLblPos]);
  }
  addProp(target, 'separator', src.separator, ', ');
  convertNumFmt(target, src.numFmt);
  addProp(target, 'shape', convertShape(src.shape));
  addProp(target, 'textStyle', convertTextStyle(src.textProps));
}

function convertLabels (dLbls: DLbls | undefined): ChartDataLabels | undefined {
  if (!dLbls) { return; }
  const out: ChartDataLabels = {};
  if (dLbls.delete) {
    out.show = [];
    return out;
  }
  convertLabelShared(out, dLbls);
  addProp(out, 'showLeaderLines', dLbls.showLeaderLines, false);
  addProp(out, 'leaderLines', dLbls.leaderLines?.shape?.line);
  return out;
}

function convertLabel (dLbl: DLbl): ChartDataLabel {
  const out: ChartDataLabel = {};
  if (dLbl.delete) {
    out.hidden = true;
    return out;
  }
  convertLabelShared(out, dLbl);
  addProp(out, 'text', convertText(dLbl.text));
  addProp(out, 'layout', convertLayout(dLbl.layout));
  return out;
}

function convertTrendline (tl: Trendline): ChartTrendline {
  const out: ChartTrendline = { type: TRENDLINE_TYPES[tl.type] };
  addProp(out, 'order', tl.order, 2);
  addProp(out, 'period', tl.period, 2);
  addProp(out, 'name', tl.name);
  addProp(out, 'forward', tl.forward, 0);
  addProp(out, 'backward', tl.backward, 0);
  addProp(out, 'intercept', tl.intercept);
  addProp(out, 'displayRSquared', tl.dispRSqr, false);
  addProp(out, 'displayEquation', tl.dispEq, false);
  addProp(out, 'line', tl.shape?.line);
  if (tl.label) {
    const label: NonNullable<ChartTrendline['label']> = {};
    convertNumFmt(label, tl.label.numFmt);
    addProp(label, 'shape', convertShape(tl.label.shape));
    addProp(label, 'textStyle', convertTextStyle(tl.label.textProps));
    addProp(label, 'text', convertText(tl.label.text));
    addProp(label, 'layout', convertLayout(tl.label.layout));
    addProp(out, 'label', hasKeys(label) ? label : undefined);
  }
  return out;
}

// ---------------------------------------------------------------------------
// The converter
// ---------------------------------------------------------------------------

class ChartBuilder {
  context: ConversionContext;
  datasetBindings: Record<string, ChartFieldBinding> = {};
  scales: ChartScale[] = [];
  axes: ChartAxis[] = [];
  /** Scale ID and axis for each native axis ID. */
  axisById = new Map<number, { scaleId: string, axis: Axis }>();
  /** Native axis ID pairs that make up the primary and secondary groups. */
  axisGroups: number[][] = [];
  /**
   * The native axis that each native axis crosses by default: in a plot's `c:axId` list (category
   * or X, value, then series), the value axis crosses the first axis, and the others cross the
   * value axis.
   */
  defaultCross = new Map<number, number>();

  constructor (context: ConversionContext) {
    this.context = context;
  }

  /** The axis group of a plot's axis IDs: primary for the first group recorded. */
  groupOf (axIds: number[] | undefined): 'primary' | 'secondary' {
    if (!axIds) { return 'primary'; }
    const key = axIds.join(',');
    return this.axisGroups.findIndex(g => g.join(',') === key) > 0 ? 'secondary' : 'primary';
  }

  /** Record a plot's axis IDs as an axis group. The first group recorded is the primary one. */
  addAxisGroup (axIds: number[]) {
    const key = axIds.join(',');
    if (!this.axisGroups.some(g => g.join(',') === key)) {
      this.axisGroups.push(axIds);
    }
  }

  /**
   * Create the scales and axes. Scale and axis IDs are derived from their role and axis group,
   * never from native axis IDs.
   */
  buildAxes (nativeAxes: Axis[], plots: Plot[]) {
    // Work out which axis group each native axis belongs to.
    const groupOfAxis = new Map<number, 'primary' | 'secondary'>();
    for (const plot of plots) {
      if ('axId' in plot) {
        this.addAxisGroup(plot.axId);
        const group = this.groupOf(plot.axId);
        for (const id of plot.axId) {
          if (!groupOfAxis.has(id)) { groupOfAxis.set(id, group); }
        }
        plot.axId.forEach((id, index) => {
          const partner = plot.axId[index === 1 ? 0 : 1];
          if (partner != null && !this.defaultCross.has(id)) { this.defaultCross.set(id, partner); }
        });
      }
    }
    const byId = new Map(nativeAxes.map(a => [ a.axId, a ]));
    const usedIds = new Set<string>();
    const uniqueId = (base: string) => {
      let id = base;
      let n = 2;
      while (usedIds.has(id)) { id = base + n++; }
      usedIds.add(id);
      return id;
    };

    for (const axis of nativeAxes) {
      const group = groupOfAxis.get(axis.axId) ?? 'primary';
      const suffix = group === 'secondary' ? '2' : '';
      let role: string;
      if (axis.type === 'valAx') {
        // In a scatter chart both axes are value axes, so the horizontal one is `x`.
        const crossed = byId.get(axis.crossAx);
        const bothValue = crossed?.type === 'valAx';
        const horizontal = axis.axPos === 'b' || axis.axPos === 't';
        role = bothValue ? (horizontal ? 'x' : 'y') : 'value';
      }
      else if (axis.type === 'serAx') {
        role = 'series';
      }
      else {
        role = 'category';
      }
      const scaleId = uniqueId(role + suffix);
      this.axisById.set(axis.axId, { scaleId, axis });
    }

    for (const axis of nativeAxes) {
      const { scaleId } = this.axisById.get(axis.axId)!;
      const crossed = byId.get(axis.crossAx);
      this.scales.push(this.buildScale(axis, scaleId, crossed));
      this.axes.push(this.buildAxis(axis, scaleId));
    }
  }

  buildScale (axis: Axis, id: string, crossed: Axis | undefined): ChartScale {
    const reverse = axis.scaling?.orientation === 'maxMin';
    // Band or point placement is recorded on the value axis that crosses a category axis.
    const crossBetween = crossed?.type === 'valAx' ? crossed.crossBetween : undefined;
    if (axis.type === 'valAx') {
      const scale: ChartScale = { id, type: axis.scaling?.logBase ? 'log' : 'linear' };
      addProp(scale, 'reverse', reverse, false);
      addProp(scale, 'min', axis.scaling?.min);
      addProp(scale, 'max', axis.scaling?.max);
      addProp(scale, 'majorUnit', axis.majorUnit);
      addProp(scale, 'minorUnit', axis.minorUnit);
      addProp(scale, 'logBase', axis.scaling?.logBase, 10);
      return scale;
    }
    if (axis.type === 'dateAx') {
      const scale: ChartScale = { id, type: 'time' };
      addProp(scale, 'reverse', reverse, false);
      addProp(scale, 'auto', axis.auto, false);
      addProp(scale, 'placement', crossBetween === 'midCat' ? 'point' : undefined);
      addProp(scale, 'min', axis.scaling?.min);
      addProp(scale, 'max', axis.scaling?.max);
      addProp(scale, 'baseUnit', axis.baseTimeUnit);
      addProp(scale, 'majorUnit', axis.majorUnit);
      addProp(scale, 'majorTimeUnit', axis.majorTimeUnit);
      addProp(scale, 'minorUnit', axis.minorUnit);
      addProp(scale, 'minorTimeUnit', axis.minorTimeUnit);
      return scale;
    }
    const scale: ChartScaleBand | ChartScalePoint = { id, type: crossBetween === 'midCat' ? 'point' : 'band' };
    addProp(scale, 'reverse', reverse, false);
    if (axis.type === 'catAx') {
      addProp(scale, 'auto', axis.auto, false);
    }
    return scale;
  }

  buildAxis (axis: Axis, scaleId: string): ChartAxis {
    const out: ChartAxis = {
      id: scaleId + 'Axis',
      scale: scaleId,
      orient: axis.type === 'serAx' ? 'depth' : AXIS_ORIENT[axis.axPos],
    };
    addProp(out, 'hidden', axis.delete, false);
    addProp(out, 'title', convertTitle(axis.title));
    const crosses: ChartAxisCrossing = typeof axis.crosses === 'number'
      ? { type: 'value', value: axis.crosses }
      : { type: axis.crosses === 'max' || axis.crosses === 'min' ? axis.crosses : 'auto' };
    // the crossed axis is written only when it isn't the plot's default
    const crossed = this.axisById.get(axis.crossAx);
    if (crossed && this.defaultCross.get(axis.axId) !== axis.crossAx) {
      crosses.axis = crossed.scaleId + 'Axis';
    }
    if (crosses.type !== 'auto' || crosses.axis) {
      out.crosses = crosses;
    }
    const tickMarks: NonNullable<ChartAxis['tickMarks']> = {};
    const tickLabels: NonNullable<ChartAxis['tickLabels']> = {};
    if (axis.majorTickMark) {
      addProp(tickMarks, 'major', TICK_MARKS[axis.majorTickMark], 'outside');
    }
    if (axis.minorTickMark) {
      addProp(tickMarks, 'minor', TICK_MARKS[axis.minorTickMark], 'none');
    }
    addProp(tickLabels, 'position', axis.tickLblPos, 'nextTo');
    if (axis.type === 'catAx') {
      if (axis.lblAlgn) {
        addProp(tickLabels, 'align', ({ ctr: 'center', l: 'left', r: 'right' } as const)[axis.lblAlgn], 'center');
      }
      addProp(tickLabels, 'offset', axis.lblOffset, 100);
      addProp(out, 'multiLevelLabels', axis.noMultiLvlLbl == null ? null : !axis.noMultiLvlLbl, true);
    }
    if (axis.type === 'dateAx') {
      addProp(tickLabels, 'offset', axis.lblOffset, 100);
    }
    if (axis.type === 'catAx' || axis.type === 'serAx') {
      addProp(tickLabels, 'interval', axis.tickLblSkip);
      addProp(tickMarks, 'interval', axis.tickMarkSkip, 1);
    }
    addProp(out, 'tickMarks', hasKeys(tickMarks) ? tickMarks : undefined);
    addProp(out, 'tickLabels', hasKeys(tickLabels) ? tickLabels : undefined);
    addProp(out, 'gridlines', convertGridlines(axis.majorGridlines, axis.minorGridlines));
    convertNumFmt(out, axis.numFmt);
    if (axis.type === 'valAx' && axis.dispUnits) {
      const du = axis.dispUnits;
      out.displayUnits = 'builtInUnit' in du ? BUILT_IN_UNITS[du.builtInUnit] : du.custUnit;
      addProp(out, 'displayUnitsLabel', convertTitle(du.dispUnitsLbl));
    }
    addProp(out, 'shape', convertShape(axis.shape));
    addProp(out, 'textStyle', convertTextStyle(axis.textProps));
    return out;
  }

  /** Scale IDs for a plot's axes, keyed by role. */
  plotScales (plot: Plot) {
    const out: { category?: string, value?: string, x?: string, y?: string, series?: string } = {};
    if ('axId' in plot) {
      for (const id of plot.axId) {
        const entry = this.axisById.get(id);
        if (!entry) { continue; }
        const { axis, scaleId } = entry;
        if (axis.type === 'catAx' || axis.type === 'dateAx') { out.category = scaleId; }
        else if (axis.type === 'serAx') { out.series = scaleId; }
        else if (isXYPlot(plot)) {
          if (axis.axPos === 'b' || axis.axPos === 't') { out.x = scaleId; }
          else { out.y = scaleId; }
        }
        else { out.value = scaleId; }
      }
    }
    return out;
  }

  buildEncoding (plot: Plot): ChartEncoding {
    const scales = this.plotScales(plot);
    const encoding: ChartEncoding = { series: { field: 'series' } };
    if (isXYPlot(plot)) {
      encoding.x = fieldEncoding('x', scales.x);
      encoding.y = fieldEncoding('y', scales.y);
      if (plot.type === 'bubble') {
        encoding.size = { field: 'size' };
      }
    }
    else if (plot.type === 'stock') {
      // Each series feeds one of open, high, low, or close through its own encoding.
      encoding.x = fieldEncoding('category', scales.category);
    }
    else if (isArcPlot(plot)) {
      // Arc plots name their slices with `x` and size them with `angle`.
      encoding.x = { field: 'category' };
      encoding.angle = { field: 'value' };
    }
    else {
      const category: ChartEncoding['x'] = fieldEncoding('category', scales.category);
      // Multi-level categories list their outer level fields, from the outermost inward.
      const levels = readAxSource(plot.ser?.[0]?.cat)?.levels ?? 1;
      if (levels > 1) {
        category.levels = Array.from({ length: levels - 1 }, (_, i) => `category${levels - 1 - i}`);
      }
      const value = fieldEncoding('value', scales.value);
      const horizontal = (plot.type === 'bar' || plot.type === 'bar3d') && plot.barDir === 'bar';
      encoding.x = horizontal ? value : category;
      encoding.y = horizontal ? category : value;
      if (scales.series) {
        encoding.z = { field: 'series', scale: scales.series };
      }
    }
    return encoding;
  }

  buildPlotLayout (plot: Plot): ChartPlotLayout | undefined {
    if (plot.type === 'bar' || plot.type === 'bar3d') {
      const bar: LayoutSettings<'bar'> = {};
      addProp(bar, 'gapWidth', plot.gapWidth, 150);
      if (plot.type === 'bar') {
        addProp(bar, 'overlap', plot.overlap, 0);
        addProp(bar, 'connectorLines', plot.serLines?.[0]?.shape?.line);
      }
      else {
        addProp(bar, 'shape', plot.shape, 'box');
        addProp(bar, 'gapDepth', plot.gapDepth, 150);
      }
      return plotLayout('bar', bar);
    }
    if (plot.type === 'area' || plot.type === 'area3d') {
      const area: LayoutSettings<'area'> = {};
      addProp(area, 'dropLines', plot.dropLines?.shape?.line);
      if (plot.type === 'area3d') {
        addProp(area, 'gapDepth', plot.gapDepth, 150);
      }
      return plotLayout('area', area);
    }
    if (plot.type === 'line' || plot.type === 'line3d' || plot.type === 'stock') {
      const line: LayoutSettings<'line'> = {};
      if (plot.type === 'line') {
        addProp(line, 'showMarkers', plot.marker);
      }
      addProp(line, 'dropLines', plot.dropLines?.shape?.line);
      if (plot.type === 'line' || plot.type === 'stock') {
        addProp(line, 'highLowLines', plot.hiLowLines?.shape?.line);
        if (plot.upDownBars) {
          const bars: ChartUpDownBars = {};
          addProp(bars, 'gapWidth', plot.upDownBars.gapWidth, 150);
          addProp(bars, 'up', convertShape(plot.upDownBars.upBars?.shape));
          addProp(bars, 'down', convertShape(plot.upDownBars.downBars?.shape));
          line.upDownBars = bars;
        }
      }
      else {
        addProp(line, 'gapDepth', plot.gapDepth, 150);
      }
      return plot.type === 'stock' ? plotLayout('candlestick', line) : plotLayout('line', line);
    }
    if (plot.type === 'pie' || plot.type === 'pie3d') {
      const arc: LayoutSettings<'arc'> = {};
      if (plot.type === 'pie') {
        addProp(arc, 'startAngle', plot.firstSliceAng == null ? null : plot.firstSliceAng * 60000, 0);
      }
      return plotLayout('arc', arc);
    }
    if (plot.type === 'doughnut') {
      const arc: LayoutSettings<'arc'> = { variant: 'doughnut' };
      addProp(arc, 'startAngle', plot.firstSliceAng == null ? null : plot.firstSliceAng * 60000, 0);
      addProp(arc, 'holeSize', plot.holeSize, 75);
      return plotLayout('arc', arc);
    }
    if (plot.type === 'ofPie') {
      const ofPie: NonNullable<LayoutSettings<'arc'>['ofPie']> = {};
      if (plot.splitType) {
        addProp(ofPie, 'splitType', SPLIT_TYPES[plot.splitType], 'auto');
      }
      addProp(ofPie, 'splitValue', plot.splitPos);
      addProp(ofPie, 'customPoints', plot.custSplit?.secondPiePt);
      addProp(ofPie, 'secondPlotSize', plot.secondPieSize, 75);
      addProp(ofPie, 'gapWidth', plot.gapWidth, 150);
      addProp(ofPie, 'connectorLines', plot.serLines?.[0]?.shape?.line);
      const arc: LayoutSettings<'arc'> = { variant: plot.ofPieType === 'bar' ? 'barOfPie' : 'pieOfPie' };
      addProp(arc, 'ofPie', hasKeys(ofPie) ? ofPie : undefined);
      return plotLayout('arc', arc);
    }
    if (plot.type === 'scatter') {
      const scatter: LayoutSettings<'scatter'> = {};
      addProp(scatter, 'style', plot.scatterStyle, 'marker');
      return plotLayout('scatter', scatter);
    }
    if (plot.type === 'bubble') {
      const bubble: LayoutSettings<'bubble'> = {};
      addProp(bubble, 'scale', plot.bubbleScale, 100);
      if (plot.sizeRepresents) {
        addProp(bubble, 'sizeRepresents', plot.sizeRepresents === 'w' ? 'width' : 'area', 'area');
      }
      addProp(bubble, 'showNegative', plot.showNegBubbles, true);
      addProp(bubble, 'shaded', plot.bubble3D, false);
      return plotLayout('bubble', bubble);
    }
    if (plot.type === 'radar') {
      const radar: LayoutSettings<'radar'> = {};
      addProp(radar, 'style', plot.radarStyle, 'standard');
      return plotLayout('radar', radar);
    }
    if (plot.type === 'surface' || plot.type === 'surface3d') {
      const surface: LayoutSettings<'surface'> = {};
      addProp(surface, 'wireframe', plot.wireframe, false);
      const bands = (plot.bandFmts?.bandFmt ?? []).map(b => {
        const band: { index: number, shape?: Shape } = { index: b.idx };
        addProp(band, 'shape', convertShape(b.shape));
        return band;
      });
      addProp(surface, 'bandFormats', bands.length ? bands : undefined);
      return plotLayout('surface', surface);
    }
    return undefined;
  }

  /**
   * Add a binding for a series field. Returns the binding so the caller can decide whether it
   * belongs on the series or the dataset.
   */
  makeBinding (src: SourceValues, role: ChartFieldBinding['role']): ChartFieldBinding | undefined {
    const binding: ChartFieldBinding = {};
    addProp(binding, 'formula', src.formula);
    addProp(binding, 'fullFormula', src.fullFormula);
    addProp(binding, 'values', src.values);
    addProp(binding, 'role', role);
    addProp(binding, 'numberFormat', src.numberFormat, 'General');
    return hasKeys(binding) ? binding : undefined;
  }

  buildSeries (ser: Series, plot: Plot, position: number): ChartSeries {
    // The series key defaults to its ID, so it isn't written.
    const out: ChartSeries = { id: 's' + ser.idx };
    addProp(out, 'name', convertText(ser.text));
    addProp(out, 'colorIndex', ser.idx);
    addProp(out, 'order', ser.order);

    const scatter = isXYPlot(plot);
    const categoryField = scatter ? 'x' : 'category';
    const valueField = scatter ? 'y' : 'value';
    const cat = readAxSource(ser.cat);
    const val = readNumSource(ser.val);
    const errorFields: { field: string, values: SourceValues }[] = [];
    const errBars = ser.errBars ?? [];
    const errorBars: ChartErrorBars[] = errBars.map(eb => this.buildErrorBars(eb, errorFields));

    // The series' data is defined by its bindings. Category bindings are moved to the dataset
    // later if every series shares them.
    const bindings: Record<string, ChartFieldBinding> = {};
    if (cat) {
      const catBinding = this.makeBinding(cat, scatter ? 'x' : 'category');
      if (catBinding) {
        const levels = cat.levels ?? 1;
        if (levels > 1) {
          // Level 0 is the innermost level. Outer levels get fields of their own, all bound to the
          // same range.
          catBinding.level = 0;
          addProp(catBinding, 'direction', cat.direction, 'column');
          for (let level = 1; level < levels; level++) {
            bindings[`${categoryField}${level}`] = { ...catBinding, level };
          }
        }
        bindings[categoryField] = catBinding;
      }
    }
    if (val) {
      addProp(bindings, valueField, this.makeBinding(val, scatter ? 'y' : 'value'));
    }
    const size = plot.type === 'bubble' ? readNumSource(ser.bubbleSize) : undefined;
    if (size) {
      addProp(bindings, 'size', this.makeBinding(size, 'size'));
    }
    for (const { field, values } of errorFields) {
      // Custom error amounts have no role of their own: they aren't the series' values.
      addProp(bindings, field, this.makeBinding(values, undefined));
    }
    if (plot.type === 'stock') {
      // Stock series feed open, high, low, or close, by their position in series order.
      const channel = STOCK_CHANNELS[plot.ser.length as 3 | 4][position];
      const valueScale = this.plotScales(plot).value;
      out.encoding = { [channel]: valueScale ? { field: 'value', scale: valueScale } : { field: 'value' } };
      if (bindings.value) { bindings.value.role = channel; }
    }
    // "Value From Cells": labels show text from a range, mapped with the `text` channel.
    if (ser.labelsRange) {
      bindings.label = { formula: ser.labelsRange, role: 'label' };
      out.encoding = { ...out.encoding, text: { field: 'label' } };
    }
    addProp(out, 'bindings', hasKeys(bindings) ? bindings : undefined);

    addProp(out, 'shape', convertShape(ser.shape));
    addProp(out, 'marker', convertMarker(ser.marker));
    addProp(out, 'labels', convertLabels(ser.dLbls));
    addProp(out, 'points', this.buildPoints(ser, cat, val, categoryField, valueField));
    addProp(out, 'filteredPoints', ser.filteredPoints?.map(p => {
      const point: ChartFilteredPoint = { ref: p.ref };
      addProp(point, 'shape', convertShape(p.shape));
      return point;
    }));
    addProp(out, 'trendlines', ser.trendline?.length ? ser.trendline.map(convertTrendline) : undefined);
    addProp(out, 'errorBars', errorBars.length ? errorBars : undefined);
    addProp(out, 'smooth', ser.smooth, false);
    addProp(out, 'explosion', ser.explosion, 0);
    addProp(out, 'invertIfNegative', ser.invertIfNegative, false);
    // Excel writes a shape on every 3D bar series, so only one that differs from the plot's is kept
    addProp(out, 'barShape', ser.barShape, plot.type === 'bar3d' ? (plot.shape ?? 'box') : null);
    addProp(out, 'shaded', ser.bubble3D, false);
    addProp(out, 'pictureOptions', convertPictureOptions(ser.pictureOptions));
    addProp(out, 'hidden', ser.hidden, false);
    return out;
  }

  buildErrorBars (eb: ErrBars, fields: { field: string, values: SourceValues }[]): ChartErrorBars {
    const out: ChartErrorBars = { valueType: ERROR_VALUE_TYPES[eb.errValType] };
    const dir = eb.errDir ?? 'y';
    addProp(out, 'direction', eb.errDir, 'y');
    addProp(out, 'barType', eb.errBarType, 'both');
    addProp(out, 'value', eb.val);
    addProp(out, 'endCaps', eb.noEndCap == null ? null : !eb.noEndCap, true);
    addProp(out, 'line', eb.shape?.line);
    const plus = readNumSource(eb.plus);
    if (plus) {
      out.plusField = `${dir}ErrorPlus`;
      fields.push({ field: out.plusField, values: plus });
    }
    const minus = readNumSource(eb.minus);
    if (minus) {
      out.minusField = `${dir}ErrorMinus`;
      fields.push({ field: out.minusField, values: minus });
    }
    return out;
  }

  buildPoints (
    ser: Series,
    cat: CategoryValues | undefined,
    val: SourceValues | undefined,
    categoryField: string,
    valueField: string,
  ): ChartDataPoint[] | undefined {
    const { points, point } = pointMap();
    for (const dPt of ser.dPt ?? []) {
      const p = point(dPt.idx);
      addProp(p, 'shape', convertShape(dPt.shape));
      addProp(p, 'marker', convertMarker(dPt.marker));
      addProp(p, 'explosion', dPt.explosion);
      addProp(p, 'invertIfNegative', dPt.invertIfNegative);
      addProp(p, 'shaded', dPt.bubble3D);
      addProp(p, 'pictureOptions', convertPictureOptions(dPt.pictureOptions));
    }
    for (const dLbl of ser.dLbls?.dLbl ?? []) {
      point(dLbl.idx).label = convertLabel(dLbl);
    }
    const addFormats = (src: SourceValues | undefined, field: string) => {
      src?.pointFormats.forEach((format, index) => {
        const p = point(index);
        p.numberFormats ??= {};
        p.numberFormats[field] = format;
      });
    };
    addFormats(cat, categoryField);
    addFormats(val, valueField);
    // Drop points that ended up with only an index.
    const list = [ ...points.values() ].filter(p => Object.keys(p).length > 1);
    return list.length ? list.sort((a, b) => a.index - b.index) : undefined;
  }

  buildPlot (plot: Plot, index: number, axisPlotGroups: Set<string>): ChartPlot {
    let mark: ChartPlot['mark'] = 'area';
    if (isXYPlot(plot)) { mark = 'point'; }
    else if (isArcPlot(plot)) { mark = 'arc'; }
    else if (plot.type === 'stock') { mark = 'candlestick'; }
    else if (plot.type === 'surface' || plot.type === 'surface3d') { mark = 'surface'; }
    else if (plot.type === 'radar') { mark = plot.radarStyle === 'filled' ? 'area' : 'line'; }
    else if (plot.type.startsWith('bar')) { mark = 'bar'; }
    else if (plot.type.startsWith('line')) { mark = 'line'; }
    const out: ChartPlot = {
      id: 'plot' + (index + 1),
      mark,
      data: DATASET_ID,
      encoding: this.buildEncoding(plot),
      series: [],
    };
    if (plot.type === 'radar') {
      out.coordinates = 'polar';
    }
    if (isArcPlot(plot)) {
      out.coordinates = 'polar';
      // An arc plot takes the axis group that no axis-based plot uses.
      if (axisPlotGroups.has('primary') && !axisPlotGroups.has('secondary')) {
        out.axisGroup = 'secondary';
      }
    }
    else if ('axId' in plot) {
      addProp(out, 'axisGroup', this.groupOf(plot.axId), 'primary');
    }
    if ('grouping' in plot && plot.grouping) {
      addProp(out, 'grouping', plot.grouping, 'standard');
    }
    if ('varyColors' in plot) {
      addProp(out, 'varyColors', plot.varyColors, false);
    }
    out.series = [ ...(plot.ser ?? []) ]
      .sort((a, b) => a.order - b.order)
      .map((ser, position) => this.buildSeries(ser, plot, position));
    // Excel often writes plot-level labels with everything turned off, which means no labels.
    const labels = convertLabels('dLbls' in plot ? plot.dLbls : undefined);
    if (labels && !(Object.keys(labels).length === 1 && labels.show?.length === 0)) {
      out.labels = labels;
    }
    addProp(out, 'layout', this.buildPlotLayout(plot));
    return out;
  }
}

function convertLegend (cs: ChartSpace, chart: Chart): ChartLegend | undefined {
  const legend = cs.chart.legend;
  if (!legend) { return; }
  const out: ChartLegend = {};
  // a legend without c:legendPos is on the right, the schema default, even with a manual layout
  if (legend.pos) {
    addProp(out, 'position', LEGEND_POSITIONS[legend.pos], 'right');
  }
  addProp(out, 'overlay', legend.overlay, false);
  // OOXML numbers the deleted entries, and JSFChart identifies them by what they show
  const list = legendEntryList(chart);
  const hidden = (legend.legendEntry ?? [])
    .filter(e => e.delete)
    .map(e => legendEntryRef(list, e.idx))
    .filter(ref => ref != null);
  addProp(out, 'hiddenEntries', hidden.length ? hidden : undefined);
  addProp(out, 'shape', convertShape(legend.shape));
  addProp(out, 'textStyle', convertTextStyle(legend.textProps));
  addProp(out, 'layout', convertLayout(legend.layout));
  return out;
}

/**
 * Convert a parsed OOXML chart (`c:chartSpace`) into a JSF chart.
 *
 * A chart with a plot that can't be converted (a stock plot without three or four series) is left
 * out entirely, because a partial chart would misrepresent it. So is a chart without plots. Both are
 * reported with the `chart` unsupported tag.
 */
export function convertChartSpace (cs: ChartSpace, context: ConversionContext): Chart | undefined {
  const builder = new ChartBuilder(context);
  const plotArea = cs.chart?.plotArea;
  const plots: Plot[] = [];
  for (const plot of plotArea?.plots ?? []) {
    if (!isConvertiblePlot(plot)) {
      context.unsupported.add(MISSING_CHART);
      return;
    }
    plots.push(plot);
  }
  if (!plotArea || !plots.length) {
    context.unsupported.add(MISSING_CHART);
    return;
  }

  builder.buildAxes(plotArea.axes ?? [], plots);
  const axisPlotGroups = new Set(
    plots.filter(p => !isArcPlot(p) && 'axId' in p).map(p => builder.groupOf((p as { axId: number[] }).axId)),
  );
  const chartPlots = plots.map((plot, i) => builder.buildPlot(plot, i, axisPlotGroups));
  hoistSharedBindings(chartPlots, builder.datasetBindings);

  const dataset: Chart['data'][number] = { id: DATASET_ID };
  addProp(dataset, 'bindings', hasKeys(builder.datasetBindings) ? builder.datasetBindings : undefined);

  const chart: Chart = {
    data: [ dataset ],
    scales: builder.scales,
    plots: chartPlots,
  };

  const title = convertTitle(cs.chart.title);
  addProp(chart, 'title', title);
  addProp(chart, 'axes', builder.axes.length ? builder.axes : undefined);
  addProp(chart, 'legend', convertLegend(cs, chart));
  if (plotArea.dTable) {
    const dt = plotArea.dTable;
    const table: NonNullable<Chart['dataTable']> = {};
    addProp(table, 'showHorzBorder', dt.showHorzBorder, true);
    addProp(table, 'showVertBorder', dt.showVertBorder, true);
    addProp(table, 'showOutline', dt.showOutline, true);
    addProp(table, 'showKeys', dt.showKeys, false);
    addProp(table, 'shape', convertShape(dt.shape));
    addProp(table, 'textStyle', convertTextStyle(dt.textProps));
    chart.dataTable = table;
  }
  // An absent c:dispBlanksAs means blanks are plotted as zero, but JSFChart's default is `gap`.
  addProp(chart, 'showBlanksAs', cs.chart.dispBlanksAs ?? 'zero', 'gap');
  addProp(chart, 'showNaAsBlank', cs.chart.dispNaAsBlank, false);
  addProp(chart, 'showDataLabelsOverMax', cs.chart.showDLblsOverMax);
  addProp(chart, 'plotHiddenCells', cs.chart.plotVisOnly == null ? null : !cs.chart.plotVisOnly, false);
  addProp(chart, 'roundedCorners', cs.roundedCorners, false);
  addProp(chart, 'styleId', cs.style);
  addProp(chart, 'shape', convertShape(cs.shape));
  addProp(chart, 'textStyle', convertTextStyle(cs.textProps));

  const plotAreaOut: NonNullable<Chart['plotArea']> = {};
  addProp(plotAreaOut, 'shape', convertShape(plotArea.shape));
  addProp(plotAreaOut, 'layout', convertLayout(plotArea.layout));
  addProp(plotAreaOut, 'layoutTarget', plotArea.layout?.layoutTarget, 'outer');
  addProp(chart, 'plotArea', hasKeys(plotAreaOut) ? plotAreaOut : undefined);

  const { view3D } = cs.chart;
  if (plots.some(p => p.type.endsWith('3d'))) {
    const v: NonNullable<Chart['view3D']> = {};
    addProp(v, 'rotationX', view3D?.rotX == null ? null : view3D.rotX * 60000, 0);
    addProp(v, 'rotationY', view3D?.rotY == null ? null : view3D.rotY * 60000, 0);
    addProp(v, 'depth', view3D?.depthPercent, 100);
    addProp(v, 'height', view3D?.hPercent);
    addProp(v, 'rightAngleAxes', view3D?.rAngAx, false);
    addProp(v, 'perspective', view3D?.perspective, 30);
    chart.view3D = v;
  }
  // a contour (2D surface) chart is a 3D chart seen from above, and its walls show (confirmed in
  // Excel): the floor is the background and frame of the inner plot area
  if (chart.view3D || plots.some(p => p.type === 'surface')) {
    addProp(chart, 'floor', convertWall(cs.chart.floor));
    addProp(chart, 'sideWall', convertWall(cs.chart.sideWall));
    addProp(chart, 'backWall', convertWall(cs.chart.backWall));
  }

  applyTextCascade(chart, LEGACY_TEXT_FALLBACKS);
  applyShapeFallbacks(chart, LEGACY_SHAPE_FALLBACKS);
  reduceOverrides(chart);
  reduceShapes(chart);
  dropDefaultColorIndex(chart.plots);
  dropDefaultSeriesOrder(chart.plots);
  return chart;
}
