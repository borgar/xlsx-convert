import type {
  ChartAxis,
  ChartDataLabelPosition,
  ChartDataPoint,
  ChartFieldEncoding,
  ChartFieldBinding,
  ChartManualLayout,
  ChartPlot,
  ChartPlotLayout,
  ChartText,
  ChartTextStyle,
  ChartTickMark,
  ChartTitle,
  ChartValue,
  Shape,
} from '@jsfkit/types';
import { addProp } from '../../utils/addProp.ts';
import { fromA1 } from '../../utils/fromA1.ts';
import { hasKeys } from '../../utils/hasKeys.ts';
import type { TickMark } from './types/axes/TickMark.ts';
import type { ManualLayout } from './types/ManualLayout.ts';
import type { NumFmt } from './types/NumFmt.ts';
import type { Text } from './types/Text.ts';
import type { TextProps } from './types/TextProps.ts';
import type { Title } from './types/Title.ts';

/**
 * Helpers shared by the legacy chart converter (`convertChartSpace`) and the ChartEx converter
 * (`convertChartSpaceEx`).
 */

export const DATASET_ID = 'data';

export const TICK_MARKS: Record<TickMark, ChartTickMark> = {
  cross: 'cross',
  in: 'inside',
  none: 'none',
  out: 'outside',
};

export const LABEL_POSITIONS: Record<string, ChartDataLabelPosition> = {
  b: 'bottom',
  bestFit: 'bestFit',
  ctr: 'center',
  inBase: 'insideBase',
  inEnd: 'insideEnd',
  l: 'left',
  outEnd: 'outsideEnd',
  r: 'right',
  t: 'top',
};

export function convertShape (shape: Shape | undefined): Shape | undefined {
  if (!shape) { return; }
  const out: Shape = {};
  addProp(out, 'fill', shape.fill);
  addProp(out, 'line', shape.line);
  return hasKeys(out) ? out : undefined;
}

export function convertTextStyle (props: TextProps | undefined): ChartTextStyle | undefined {
  if (!props) { return; }
  const out: ChartTextStyle = {};
  const typeface = props.typeface;
  if (typeface?.startsWith('+mn-')) {
    out.fontScheme = 'minor';
  }
  else if (typeface?.startsWith('+mj-')) {
    out.fontScheme = 'major';
  }
  else {
    addProp(out, 'fontFamily', typeface);
  }
  addProp(out, 'fontSize', props.size);
  addProp(out, 'color', props.color);
  addProp(out, 'bold', props.bold);
  addProp(out, 'italic', props.italic);
  addProp(out, 'underline', props.underline);
  addProp(out, 'rot', props.rot);
  addProp(out, 'vert', props.vert);
  return hasKeys(out) ? out : undefined;
}

export function convertLayout (layout: ManualLayout | undefined): ChartManualLayout | undefined {
  if (!layout) { return; }
  const out: ChartManualLayout = {};
  addProp(out, 'x', layout.x);
  addProp(out, 'y', layout.y);
  addProp(out, 'w', layout.w);
  addProp(out, 'h', layout.h);
  addProp(out, 'xMode', layout.xMode, 'factor');
  addProp(out, 'yMode', layout.yMode, 'factor');
  addProp(out, 'wMode', layout.wMode, 'factor');
  addProp(out, 'hMode', layout.hMode, 'factor');
  return hasKeys(out) ? out : undefined;
}

type LayoutType = ChartPlotLayout['type'];

/**
 * The settings for one kind of plot, without their `type`.
 */
export type LayoutSettings<T extends LayoutType> = Omit<Extract<ChartPlotLayout, { type: T }>, 'type'>;

/**
 * A plot's layout: its settings under their `type`. When the settings are all absent, the plot has
 * no layout.
 */
export function plotLayout<T extends LayoutType> (type: T, settings?: LayoutSettings<T>): ChartPlotLayout | undefined {
  return settings && hasKeys(settings) ? { type, ...settings } as ChartPlotLayout : undefined;
}

export function convertText (text: Text | string | undefined): ChartText | undefined {
  if (text == null) { return; }
  if (typeof text === 'string') {
    return { text };
  }
  if ('type' in text && text.type === 'strRef') {
    // Text taken from a cell keeps only its formula. The cached text isn't read.
    return { formula: text.f };
  }
  if ('p' in text) {
    return { text: text.p.map(p => p.text).join('\n') };
  }
}

/**
 * Convert a title, or any element that holds text like one: an axis title or a display units
 * label.
 */
export function convertTitle (title: Title | undefined): ChartTitle | undefined {
  if (!title) { return; }
  // An empty title object means "show the automatic title text".
  const out: ChartTitle = { ...convertText(title.text) };
  addProp(out, 'overlay', title.overlay, false);
  addProp(out, 'shape', convertShape(title.shape));
  addProp(out, 'textStyle', convertTextStyle(title.textProps));
  addProp(out, 'layout', convertLayout(title.layout));
  return out;
}

export function convertNumFmt (target: { numberFormat?: string, sourceLinked?: boolean }, numFmt?: NumFmt) {
  if (numFmt) {
    addProp(target, 'numberFormat', numFmt.formatCode, 'General');
    addProp(target, 'sourceLinked', numFmt.sourceLinked, true);
  }
}

/**
 * A cached or literal chart value, read from its text. Text data is always text: an error and text
 * that looks like one are written the same way, so they can't be told apart. Number data holds
 * numbers, except that a legacy chart's number data can also hold `#N/A` (confirmed in Excel).
 * Excel writes other errors and text there as 0, and won't open a file with them in it.
 *
 * @param v The value's text
 * @param numeric Whether the value is from number data
 * @param naIsError Whether `#N/A` in number data is an error, as it is in legacy charts
 */
export function toValue (v: string, numeric: boolean, naIsError = false): ChartValue {
  if (!numeric) {
    return v;
  }
  if (naIsError && v === '#N/A') {
    return { t: 'e', v };
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : v;
}

/**
 * Work out the number of levels in a multi-level category range, and which way its values run,
 * from the range's shape: the levels are the narrower side.
 */
export function inferLevels (formula: string): { levels?: number, direction?: 'column' | 'row' } {
  const ref = formula.slice(formula.lastIndexOf('!') + 1);
  const range = fromA1(ref);
  if (range?.top == null || range.left == null || range.bottom == null || range.right == null) {
    return {};
  }
  const width = range.right - range.left + 1;
  const height = range.bottom - range.top + 1;
  return width > height
    ? { levels: height, direction: 'row' }
    : { levels: width, direction: 'column' };
}

/**
 * Move bindings that every series shares to the dataset, so a shared category range is written
 * once.
 */
export function hoistSharedBindings (plots: ChartPlot[], datasetBindings: Record<string, ChartFieldBinding>) {
  // Series without bindings of their own (such as Pareto lines, which read a transform) don't count.
  const allSeries = plots.flatMap(p => p.series ?? []).filter(s => s.bindings);
  if (allSeries.length < 2) { return; }
  const fields = new Set(allSeries.flatMap(s => Object.keys(s.bindings ?? {})));
  for (const field of fields) {
    const first = JSON.stringify(allSeries[0].bindings?.[field]);
    const shared = first != null && allSeries.every(s => JSON.stringify(s.bindings?.[field]) === first);
    if (shared && allSeries[0].bindings?.[field]?.role === 'category') {
      datasetBindings[field] = allSeries[0].bindings[field];
      for (const s of allSeries) {
        delete s.bindings![field];
        if (!hasKeys(s.bindings!)) { delete s.bindings; }
      }
    }
  }
}

/**
 * Remove the series' `order` when it says nothing: when the order already rises through each
 * plot's series list in turn, in plot order, which is what a chart without `order` means. Only
 * the relative order matters, so values with gaps (such as 0, 2, 5) count as rising.
 */
/**
 * Leave out each series' `colorIndex` where it equals the default: the series' position in the
 * chart's series order. Run this after everything that reads `colorIndex`.
 */
export function dropDefaultColorIndex (plots: ChartPlot[]) {
  const all = plots.flatMap(p => p.series ?? []);
  const byOrder = [ ...all ].sort((a, b) => (a.order ?? all.indexOf(a)) - (b.order ?? all.indexOf(b)));
  byOrder.forEach((s, position) => {
    if (s.colorIndex === position) {
      delete s.colorIndex;
    }
  });
}

export function dropDefaultSeriesOrder (plots: ChartPlot[]) {
  const allSeries = plots.flatMap(p => p.series ?? []);
  const rising = allSeries.every((s, i) => s.order != null && (i === 0 || s.order > allSeries[i - 1].order!));
  if (rising) {
    for (const s of allSeries) {
      delete s.order;
    }
  }
}

/**
 * An axis's gridlines, from the shapes of its major and minor gridline elements. An element
 * without a line shows the default gridlines.
 */
export function convertGridlines (major: Shape | undefined, minor: Shape | undefined): ChartAxis['gridlines'] {
  if (!major && !minor) { return; }
  const gridlines: NonNullable<ChartAxis['gridlines']> = {};
  if (major) { gridlines.major = major.line ?? {}; }
  if (minor) { gridlines.minor = minor.line ?? {}; }
  return gridlines;
}

/** A field encoding, with its scale when there is one. */
export function fieldEncoding (field: string, scale?: string): ChartFieldEncoding {
  return scale ? { field, scale } : { field };
}

/**
 * A map of data point overrides by index, and a function that gets the override for an index,
 * creating it the first time.
 */
export function pointMap () {
  const points = new Map<number, ChartDataPoint>();
  const point = (index: number): ChartDataPoint => {
    let p = points.get(index);
    if (!p) {
      p = { index };
      points.set(index, p);
    }
    return p;
  };
  return { points, point };
}
