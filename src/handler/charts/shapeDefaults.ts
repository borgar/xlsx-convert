import type { Chart, ChartAxis, ChartDataLabels, ChartPlot, ChartSeries, Color, Fill, Line, NoFill, SchemeColor, Shape } from '@jsfkit/types';

/**
 * The kinds of chart element that have a default fill and line (spec section 2.7, "Shape
 * defaults").
 */
export type ShapeElement =
  'chartArea' |
  'plotArea' |
  'plotArea3d' |
  'floor' |
  'wall' |
  'label' |
  'dataTable' |
  'categoryAxis' |
  'axis' |
  'majorGridlines' |
  'minorGridlines' |
  'lineSeries' |
  'filledSeries' |
  'marker' |
  'trendline' |
  'errorBars' |
  'connectorLines' |
  'highLowLines' |
  'upBars' |
  'downBars';

/**
 * An element's default fill and line. Elements drawn only as a line, such as gridlines, have no
 * fill.
 */
export type ShapeDefaults = { fill?: Fill, line: Line };

/** Gives the defaults of an element. `color` is the automatic color, for series and their parts. */
export type ShapeDefaultsTable = (element: ShapeElement, color: Color) => ShapeDefaults;

const ACCENTS = [ 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6' ] as const;

/**
 * The automatic color for a color index: the six theme accents in turn, with a different luminance
 * on each pass after the first.
 */
export function automaticColor (index: number): Color {
  const value = ACCENTS[index % 6];
  const pass = Math.floor(index / 6) % 4;
  if (pass === 1) {
    return { type: 'theme', value, transforms: [ { type: 'lumMod', value: 60 } ] };
  }
  if (pass === 2) {
    return { type: 'theme', value, transforms: [ { type: 'lumMod', value: 80 }, { type: 'lumOff', value: 20 } ] };
  }
  if (pass === 3) {
    return { type: 'theme', value, transforms: [ { type: 'lumMod', value: 80 } ] };
  }
  return { type: 'theme', value };
}

// These return fresh objects, because defaults can end up in a chart's output, where a shared
// object would be shared by every chart converted.
const noFill = (): NoFill => ({ type: 'none' });
const noLine = (): Line => ({ fill: noFill() });

const solid = (bg: Color) => ({ type: 'solid', bg }) as const;

function theme (value: SchemeColor['value'], lumMod?: number, lumOff?: number): Color {
  const color: Color = { type: 'theme', value };
  if (lumMod != null) {
    color.transforms = [ { type: 'lumMod', value: lumMod } ];
    if (lumOff != null) {
      color.transforms.push({ type: 'lumOff', value: lumOff });
    }
  }
  return color;
}

function tint (value: SchemeColor['value'], amount: number): Color {
  return { type: 'theme', value, transforms: [ { type: 'tint', value: amount } ] };
}

/** A 0.75pt line with round joins, as Excel's chart style part writes them. */
const thin = (color: Color): Line => ({ width: 9525, fill: solid(color), join: 'round' });

/** A 0.75pt line without a join, as Excel's automatic formatting draws them. */
const plain = (color: Color): Line => ({ width: 9525, fill: solid(color) });

/**
 * JSFChart's shape defaults: the values in Excel's default chart style part (`201`), which Excel
 * writes on every element of the charts it creates.
 */
export const JSF_SHAPE_DEFAULTS: ShapeDefaultsTable = (element, color) => {
  const tx1 = (lumMod: number, lumOff: number) => thin(theme('tx1', lumMod, lumOff));
  const table: Partial<Record<ShapeElement, ShapeDefaults>> = {
    chartArea: { fill: solid(theme('bg1')), line: tx1(15, 85) },
    dataTable: { fill: noFill(), line: tx1(15, 85) },
    categoryAxis: { fill: noFill(), line: tx1(15, 85) },
    majorGridlines: { line: tx1(15, 85) },
    minorGridlines: { line: tx1(5, 95) },
    lineSeries: { fill: noFill(), line: { width: 28575, cap: 'round', fill: solid(color), join: 'round' } },
    filledSeries: { fill: solid(color), line: noLine() },
    marker: { fill: solid(color), line: { width: 9525, cap: 'square', fill: solid(color) } },
    trendline: { line: { width: 19050, cap: 'round', fill: solid(color), style: 'sysDot' } },
    errorBars: { line: tx1(65, 35) },
    connectorLines: { line: tx1(35, 65) },
    highLowLines: { line: tx1(75, 25) },
    upBars: { fill: solid(theme('lt1')), line: tx1(65, 35) },
    downBars: { fill: solid(theme('dk1', 75, 25)), line: tx1(65, 35) },
  };
  // plot area, floor, walls, labels, and other axes
  return table[element] ?? { fill: noFill(), line: noLine() };
};

/**
 * What Excel shows in a legacy chart for a fill or line that the file leaves out: its automatic
 * formatting for chart style 2. This is what Excel 2013 and later always write, and what a missing
 * `c:style` means. The chart area, axis line, gridline, and trendline values are confirmed in Excel
 * (`chart-shape-defaults.xlsx`), and so are the floor's line and the back and side walls' lack of
 * one (`chart-contour-walls-2.xlsx`). The rest are from LibreOffice's table of Excel's automatic
 * formats, which wrongly gives the walls the floor's line.
 */
export const LEGACY_SHAPE_FALLBACKS: ShapeDefaultsTable = (element, color) => {
  const tx1Tint75 = plain(tint('tx1', 75));
  const tx1 = plain(theme('tx1'));
  const table: Partial<Record<ShapeElement, ShapeDefaults>> = {
    chartArea: { fill: solid(theme('bg1')), line: tx1Tint75 },
    plotArea: { fill: solid(theme('bg1')), line: noLine() },
    floor: { fill: noFill(), line: tx1Tint75 },
    dataTable: { fill: noFill(), line: tx1Tint75 },
    categoryAxis: { fill: noFill(), line: tx1Tint75 },
    axis: { fill: noFill(), line: tx1Tint75 },
    majorGridlines: { line: tx1Tint75 },
    minorGridlines: { line: plain(tint('tx1', 50)) },
    trendline: { line: tx1 },
    errorBars: { line: tx1 },
    connectorLines: { line: tx1 },
    highLowLines: { line: tx1 },
    upBars: { fill: solid(tint('dk1', 5)), line: tx1 },
    downBars: { fill: solid(tint('dk1', 95)), line: tx1 },
  };
  return table[element] ?? JSF_SHAPE_DEFAULTS(element, color);
};

const LEGACY_MARKS = new Set([ 'bar', 'line', 'area', 'point', 'arc', 'candlestick', 'surface' ]);

function seriesElement (chart: Chart, plot: ChartPlot): ShapeElement {
  // a 3D line chart draws each series as a filled ribbon
  if ((plot.mark === 'line' && !chart.view3D) || plot.mark === 'candlestick' || (plot.mark === 'point' && !plot.encoding.size)) {
    return 'lineSeries';
  }
  return 'filledSeries';
}

function isCategoryAxis (chart: Chart, axis: ChartAxis): boolean {
  if (axis.orient === 'depth') {
    return false;
  }
  const type = chart.scales.find(s => s.id === axis.scale)?.type;
  if (type === 'band' || type === 'point' || type === 'time') {
    return true;
  }
  return chart.plots.some(p => p.mark === 'point' && p.encoding.x?.scale === axis.scale);
}

/** Whether a chart has walls: a 3D chart, or a contour chart, which is one seen from above. */
function hasWalls (chart: Chart): boolean {
  return !!chart.view3D || chart.plots.some(p => p.mark === 'surface');
}

/** Whether a plot colors each point rather than each series, as the legend does. */
function colorsByPoint (chart: Chart, plot: ChartPlot): boolean {
  if (plot.mark === 'arc') {
    return plot.varyColors !== false;
  }
  return !!plot.varyColors && chart.plots.length === 1 && plot.series.filter(s => !s.hidden).length === 1;
}

/** Each series' color index: its `colorIndex`, or its position in series order. */
function colorIndexes (chart: Chart): Map<ChartSeries, number> {
  const all = chart.plots.flatMap(p => p.series);
  const byOrder = [ ...all ].sort((a, b) => (a.order ?? all.indexOf(a)) - (b.order ?? all.indexOf(b)));
  return new Map(all.map(s => [ s, s.colorIndex ?? byOrder.indexOf(s) ]));
}

type ShapeSlot = {
  element: ShapeElement,
  color: Color,
  get: () => Shape | undefined,
  set: (shape: Shape | undefined) => void,
  /** The fill default is per point, so the series has none. */
  noFillDefault?: boolean,
  /** The element may not exist yet, and resolving its shape creates it. */
  create?: boolean,
};

type LineSlot = {
  element: ShapeElement,
  color: Color,
  get: () => Line | undefined,
  set: (line: Line | undefined) => void,
  /** The element is shown when its line is present, so an absent line isn't resolved. */
  presence: boolean,
  /** What the source application shows for an absent line isn't known, so it isn't resolved. */
  optional?: boolean,
};

const TX1: Color = { type: 'theme', value: 'tx1' };

function holder<T extends { shape?: Shape }> (
  element: ShapeElement,
  target: T | undefined,
  color: Color = TX1,
  create = false,
): ShapeSlot[] {
  if (!target) { return []; }
  return [ {
    element,
    color,
    create,
    get: () => target.shape,
    set: shape => {
      if (shape) { target.shape = shape; }
      else { delete target.shape; }
    },
  } ];
}

function lineOf<T extends object, K extends keyof T> (
  element: ShapeElement,
  target: T | undefined,
  key: K,
  presence: boolean,
  color: Color = TX1,
): LineSlot[] {
  if (!target) { return []; }
  return [ {
    element,
    color,
    presence,
    get: () => target[key] as Line | undefined,
    set: line => {
      if (line) { target[key] = line as T[K]; }
      else { delete target[key]; }
    },
  } ];
}

/**
 * Leader lines, which may be styled even when they're hidden. Excel's automatic leader lines
 * aren't known, so a missing one is taken to mean JSFChart's default.
 */
function leaderLines (labels: ChartDataLabels | undefined): LineSlot[] {
  return lineOf('connectorLines', labels, 'leaderLines', false).map(slot => ({ ...slot, optional: true }));
}

/** Every element of a chart that has a shape or line, except data points. */
function slots (chart: Chart): { shapes: ShapeSlot[], lines: LineSlot[] } {
  const shapes: ShapeSlot[] = [];
  const lines: LineSlot[] = [];

  shapes.push(...holder('chartArea', chart, TX1, true));
  shapes.push({
    element: hasWalls(chart) ? 'plotArea3d' : 'plotArea',
    color: TX1,
    create: true,
    get: () => chart.plotArea?.shape,
    set: shape => {
      if (shape) { (chart.plotArea ??= {}).shape = shape; }
      else if (chart.plotArea) {
        delete chart.plotArea.shape;
        if (!Object.keys(chart.plotArea).length) { delete chart.plotArea; }
      }
    },
  });
  if (hasWalls(chart)) {
    for (const key of [ 'floor', 'sideWall', 'backWall' ] as const) {
      shapes.push({
        element: key === 'floor' ? 'floor' : 'wall',
        color: TX1,
        create: true,
        get: () => chart[key]?.shape,
        set: shape => {
          if (shape) { (chart[key] ??= {}).shape = shape; }
          else if (chart[key]) {
            delete chart[key].shape;
            if (!Object.keys(chart[key]).length) { delete chart[key]; }
          }
        },
      });
    }
  }
  shapes.push(...holder('label', chart.title));
  shapes.push(...holder('label', chart.legend));
  shapes.push(...holder('dataTable', chart.dataTable, TX1, true));
  for (const axis of chart.axes ?? []) {
    shapes.push(...holder(isCategoryAxis(chart, axis) ? 'categoryAxis' : 'axis', axis, TX1, true));
    shapes.push(...holder('label', axis.title));
    shapes.push(...holder('label', axis.displayUnitsLabel));
    lines.push(...lineOf('majorGridlines', axis.gridlines, 'major', true));
    lines.push(...lineOf('minorGridlines', axis.gridlines, 'minor', true));
  }

  const indexes = colorIndexes(chart);
  for (const plot of chart.plots) {
    const layout = plot.layout;
    const withDropLines = layout?.type === 'line' || layout?.type === 'area' || layout?.type === 'candlestick' ? layout : undefined;
    const withHighLow = layout?.type === 'line' || layout?.type === 'candlestick' ? layout : undefined;
    lines.push(...lineOf('connectorLines', withDropLines, 'dropLines', true));
    const connectors = layout?.type === 'bar' ? layout : layout?.type === 'arc' ? layout.ofPie : undefined;
    lines.push(...lineOf('connectorLines', connectors, 'connectorLines', true));
    lines.push(...lineOf('highLowLines', withHighLow, 'highLowLines', true));
    shapes.push(...holder('label', plot.labels));
    lines.push(...leaderLines(plot.labels));
    if (withHighLow?.upDownBars) {
      const bars = withHighLow.upDownBars;
      for (const key of [ 'up', 'down' ] as const) {
        shapes.push({
          element: key === 'up' ? 'upBars' : 'downBars',
          color: TX1,
          create: true,
          get: () => bars[key],
          set: shape => {
            if (shape) { bars[key] = shape; }
            else { delete bars[key]; }
          },
        });
      }
    }
    const byPoint = colorsByPoint(chart, plot);
    for (const series of plot.series) {
      const color = automaticColor(indexes.get(series) ?? 0);
      if (LEGACY_MARKS.has(plot.mark)) {
        const [ slot ] = holder(seriesElement(chart, plot), series, color, true);
        slot.noFillDefault = byPoint;
        shapes.push(slot);
        shapes.push(...holder('marker', series.marker, color));
      }
      shapes.push(...holder('label', series.labels));
      lines.push(...leaderLines(series.labels));
      for (const trendline of series.trendlines ?? []) {
        lines.push(...lineOf('trendline', trendline, 'line', false, color));
        shapes.push(...holder('label', trendline.label));
      }
      for (const errorBars of series.errorBars ?? []) {
        lines.push(...lineOf('errorBars', errorBars, 'line', false));
      }
    }
  }
  return { shapes, lines };
}

/** Fill in the color and width that a line leaves out, from the line it falls back to. */
function completeLine (line: Line, fallback: Line): Line {
  // an empty line, which shows an element such as gridlines, is the default line
  if (!Object.keys(line).length) {
    return fallback;
  }
  const out = { ...line };
  const fill = out.fill ?? fallback.fill ?? noFill();
  if (fill.type === 'none') {
    // a line that isn't drawn has nothing else to say
    return { fill };
  }
  out.fill = fill;
  out.width ??= fallback.width ?? 9525;
  return out;
}

/**
 * Write out what the source application shows for the fills and lines that a converted chart
 * leaves out, so that they can be compared with JSFChart's defaults. Data points are left alone:
 * what they leave out comes from their series.
 */
export function applyShapeFallbacks (chart: Chart, fallbacks: ShapeDefaultsTable) {
  const { shapes, lines } = slots(chart);
  for (const slot of shapes) {
    const own = slot.get();
    if (!own && !slot.create) {
      continue;
    }
    const fallback = fallbacks(slot.element, slot.color);
    const out: Shape = { ...own };
    if (!out.fill && fallback.fill && !slot.noFillDefault) {
      out.fill = fallback.fill;
    }
    out.line = out.line ? completeLine(out.line, fallback.line) : fallback.line;
    slot.set(out);
  }
  for (const slot of lines) {
    const own = slot.get();
    if (!own && (slot.presence || slot.optional)) {
      continue;
    }
    const fallback = fallbacks(slot.element, slot.color).line;
    slot.set(own ? completeLine(own, fallback) : fallback);
  }
}

function canonical (value: unknown): string {
  return JSON.stringify(value, (_, v) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      return Object.fromEntries(Object.keys(v).sort().map(k => [ k, v[k] ]));
    }
    return v;
  });
}

const same = (a: unknown, b: unknown) => canonical(a) === canonical(b);

/**
 * Reduce a line against its default: nothing when they're the same, and otherwise without the fill
 * and width that it shares with the default, which a line takes when it leaves them out.
 */
function reduceLine (line: Line | undefined, fallback: Line): Line | undefined {
  if (!line || same(line, fallback)) {
    return;
  }
  const out = { ...line };
  if (out.fill && same(out.fill, fallback.fill)) { delete out.fill; }
  if (out.width != null && out.width === fallback.width) { delete out.width; }
  // an empty line would mean the default, which this isn't
  return Object.keys(out).length ? out : line;
}

/**
 * Leave out every fill and line that equals JSFChart's default for its element. Run this after the
 * overrides are reduced, so that a data point keeps only what differs from its series.
 */
export function reduceShapes (chart: Chart) {
  // Data points first, while their series still have every property they set. A point's property
  // can only match its default when its series doesn't set one, because the overrides have
  // already been reduced against the series.
  const indexes = colorIndexes(chart);
  for (const plot of chart.plots) {
    if (!LEGACY_MARKS.has(plot.mark)) {
      continue;
    }
    const byPoint = colorsByPoint(chart, plot);
    const element = seriesElement(chart, plot);
    for (const series of plot.series) {
      for (const point of series.points ?? []) {
        if (!point.shape) {
          continue;
        }
        const color = automaticColor(byPoint ? point.index : (indexes.get(series) ?? 0));
        const defaults = JSF_SHAPE_DEFAULTS(element, color);
        const shape = { ...point.shape };
        if (!series.shape?.fill && same(shape.fill, defaults.fill)) { delete shape.fill; }
        if (!series.shape?.line && same(shape.line, defaults.line)) { delete shape.line; }
        if (Object.keys(shape).length) { point.shape = shape; }
        else { delete point.shape; }
      }
      if (series.points) {
        series.points = series.points.filter(p => Object.keys(p).length > 1);
        if (!series.points.length) { delete series.points; }
      }
    }
  }

  const { shapes, lines } = slots(chart);
  for (const slot of shapes) {
    const own = slot.get();
    if (!own) {
      continue;
    }
    const defaults = JSF_SHAPE_DEFAULTS(slot.element, slot.color);
    const out: Shape = { ...own };
    if (!slot.noFillDefault && same(out.fill, defaults.fill)) { delete out.fill; }
    const line = reduceLine(out.line, defaults.line);
    if (line) { out.line = line; }
    else { delete out.line; }
    slot.set(Object.keys(out).length ? out : undefined);
  }
  for (const slot of lines) {
    const own = slot.get();
    if (own) {
      // a line that shows its element stays, empty
      slot.set(reduceLine(own, JSF_SHAPE_DEFAULTS(slot.element, slot.color).line) ?? (slot.presence ? {} : undefined));
    }
  }
  // a series' labels left with nothing of their own are the same as none
  for (const plot of chart.plots) {
    for (const series of plot.series) {
      if (series.labels && !Object.keys(series.labels).length) {
        delete series.labels;
      }
    }
  }
}
