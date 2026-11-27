import type { Chart, ChartTextStyle, Color } from '@jsfkit/types';

/**
 * The kinds of chart element that show text, each with its own defaults.
 */
export type ChartTextElement =
  'title' |
  'axisTitle' |
  'axisLabels' |
  'unitsLabel' |
  'legend' |
  'dataLabels' |
  'trendlineLabel' |
  'dataTable';

/** The text properties that cascade, fully resolved. */
type ResolvedText = {
  /** `scheme:minor`, `scheme:major`, or `family:<name>`. */
  typeface: string;
  fontSize: number;
  color: Color;
  bold: boolean;
  italic: boolean;
};

type TextDefaults = Record<ChartTextElement, ResolvedText>;

const TX1: Color = { type: 'theme', value: 'tx1' };
const TX1_65: Color = {
  type: 'theme',
  value: 'tx1',
  transforms: [ { type: 'lumMod', value: 65 }, { type: 'lumOff', value: 35 } ],
};
const TX1_75: Color = {
  type: 'theme',
  value: 'tx1',
  transforms: [ { type: 'lumMod', value: 75 }, { type: 'lumOff', value: 25 } ],
};

function defaults (
  sizes: Record<ChartTextElement, number>,
  colors: Partial<Record<ChartTextElement, Color>>,
  color: Color,
  bold: ChartTextElement[] = [],
): TextDefaults {
  const out = {} as TextDefaults;
  for (const [ element, fontSize ] of Object.entries(sizes) as [ChartTextElement, number][]) {
    out[element] = {
      typeface: 'scheme:minor',
      fontSize,
      color: colors[element] ?? color,
      bold: bold.includes(element),
      italic: false,
    };
  }
  return out;
}

/**
 * JSFChart's defaults: what a chart element's text looks like when neither the element nor
 * `Chart.textStyle` sets a property. These are the values in Excel's chart style parts, which
 * Excel writes on every element of the charts it creates.
 */
export const JSF_TEXT_DEFAULTS: TextDefaults = defaults(
  {
    title: 14,
    axisTitle: 10,
    axisLabels: 9,
    unitsLabel: 9,
    legend: 9,
    dataLabels: 9,
    trendlineLabel: 9,
    dataTable: 9,
  },
  { dataLabels: TX1_75 },
  TX1_65,
);

/**
 * What Excel shows in a legacy chart for a property that neither the element nor the chart-wide
 * text properties set. Excel's chart engine supplies these, not the chart style part (confirmed in
 * Excel). The trendline label and data table values are assumed to match the other labels.
 */
export const LEGACY_TEXT_FALLBACKS: TextDefaults = defaults(
  {
    title: 18,
    axisTitle: 10,
    axisLabels: 10,
    unitsLabel: 10,
    legend: 10,
    dataLabels: 10,
    trendlineLabel: 10,
    dataTable: 10,
  },
  {},
  TX1,
  [ 'title', 'axisTitle', 'unitsLabel' ],
);

/**
 * What Excel shows in a ChartEx chart for a property that the element doesn't set. These are the
 * values in ChartEx's chart style part. The display units label is assumed to match the axis.
 */
export const CHARTEX_TEXT_FALLBACKS: TextDefaults = defaults(
  {
    title: 14,
    axisTitle: 9,
    axisLabels: 9,
    unitsLabel: 9,
    legend: 9,
    dataLabels: 9,
    trendlineLabel: 9,
    dataTable: 9,
  },
  {},
  TX1_65,
);

/**
 * In legacy charts, a chart title without a size of its own is 1.2 times the chart-wide size
 * (confirmed in Excel). Other elements take the chart-wide size as it is.
 */
export const TITLE_SIZE_RATIO = 1.2;

function typefaceOf (style: ChartTextStyle | undefined): string | undefined {
  if (style?.fontFamily) {
    return 'family:' + style.fontFamily;
  }
  if (style?.fontScheme) {
    return 'scheme:' + style.fontScheme;
  }
}

/**
 * Resolve the cascading text properties of an element: its own style, then the chart-wide style,
 * then the defaults.
 */
function resolve (
  element: ChartTextElement,
  own: ChartTextStyle | undefined,
  chart: ChartTextStyle | undefined,
  base: TextDefaults,
): ResolvedText {
  const fallback = base[element];
  let chartSize = chart?.fontSize;
  if (chartSize != null && element === 'title') {
    chartSize = Math.round(chartSize * TITLE_SIZE_RATIO * 100) / 100;
  }
  return {
    typeface: typefaceOf(own) ?? typefaceOf(chart) ?? fallback.typeface,
    fontSize: own?.fontSize ?? chartSize ?? fallback.fontSize,
    color: own?.color ?? chart?.color ?? fallback.color,
    bold: own?.bold ?? chart?.bold ?? fallback.bold,
    italic: own?.italic ?? chart?.italic ?? fallback.italic,
  };
}

function sameColor (a: Color, b: Color): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Reduce an element's text style to what the JSFChart cascade doesn't already give it.
 *
 * `fallbacks` describes what the source application shows for properties that aren't set. Each
 * cascading property is dropped when JSFChart's cascade gives the same value the application
 * shows, and written out when it doesn't. Properties that don't cascade are kept as they are.
 */
export function minimizeTextStyle (
  element: ChartTextElement,
  own: ChartTextStyle | undefined,
  chart: ChartTextStyle | undefined,
  fallbacks: TextDefaults,
): ChartTextStyle | undefined {
  const shown = resolve(element, own, chart, fallbacks);
  const implied = resolve(element, undefined, chart, JSF_TEXT_DEFAULTS);
  const out: ChartTextStyle = { ...own };
  delete out.fontFamily;
  delete out.fontScheme;
  delete out.fontSize;
  delete out.color;
  delete out.bold;
  delete out.italic;
  if (shown.typeface !== implied.typeface) {
    const [ kind, name ] = shown.typeface.split(/:(.*)/);
    if (kind === 'family') { out.fontFamily = name; }
    else { out.fontScheme = name as 'major' | 'minor'; }
  }
  if (shown.fontSize !== implied.fontSize) { out.fontSize = shown.fontSize; }
  if (!sameColor(shown.color, implied.color)) { out.color = shown.color; }
  if (shown.bold !== implied.bold) { out.bold = shown.bold; }
  if (shown.italic !== implied.italic) { out.italic = shown.italic; }
  return Object.keys(out).length ? out : undefined;
}

/** Layer a style's cascading properties over resolved ones. */
function layer (own: ChartTextStyle | undefined, parent: ResolvedText): ResolvedText {
  return {
    typeface: typefaceOf(own) ?? parent.typeface,
    fontSize: own?.fontSize ?? parent.fontSize,
    color: own?.color ?? parent.color,
    bold: own?.bold ?? parent.bold,
    italic: own?.italic ?? parent.italic,
  };
}

/**
 * Reduce a style to what differs from the resolved style it inherits, such as a point label's from
 * its series' labels. Properties that don't cascade are kept as they are.
 */
function minimizeAgainst (own: ChartTextStyle | undefined, parent: ResolvedText): ChartTextStyle | undefined {
  if (!own) { return; }
  const out: ChartTextStyle = { ...own };
  const typeface = typefaceOf(own);
  if (typeface === parent.typeface) {
    delete out.fontFamily;
    delete out.fontScheme;
  }
  if (own.fontSize === parent.fontSize) { delete out.fontSize; }
  if (own.color && sameColor(own.color, parent.color)) { delete out.color; }
  if (own.bold === parent.bold) { delete out.bold; }
  if (own.italic === parent.italic) { delete out.italic; }
  return Object.keys(out).length ? out : undefined;
}

function setStyle (target: { textStyle?: ChartTextStyle }, style: ChartTextStyle | undefined) {
  if (style) {
    target.textStyle = style;
  }
  else {
    delete target.textStyle;
  }
}

function apply<T extends { textStyle?: ChartTextStyle }> (
  target: T | undefined,
  element: ChartTextElement,
  chart: ChartTextStyle | undefined,
  fallbacks: TextDefaults,
) {
  if (!target) { return; }
  setStyle(target, minimizeTextStyle(element, target.textStyle, chart, fallbacks));
}

/**
 * Reduce every element's text style in a converted chart to what the cascade doesn't supply,
 * given what the source application shows for unset properties.
 *
 * Data labels inherit through the labels they override before the chart-wide style: a series'
 * labels from its plot's labels, and a point's label from its series' labels. So each is reduced
 * against the resolved style of the labels it overrides. That Excel inherits text properties this
 * way isn't confirmed.
 */
export function applyTextCascade (chart: Chart, fallbacks: TextDefaults) {
  const chartStyle = chart.textStyle;
  apply(chart.title, 'title', chartStyle, fallbacks);
  for (const axis of chart.axes ?? []) {
    apply(axis, 'axisLabels', chartStyle, fallbacks);
    apply(axis.title, 'axisTitle', chartStyle, fallbacks);
    apply(axis.displayUnitsLabel, 'unitsLabel', chartStyle, fallbacks);
  }
  apply(chart.legend, 'legend', chartStyle, fallbacks);
  for (const plot of chart.plots) {
    // resolve what each level of labels shows before reducing it
    const plotShown = resolve('dataLabels', plot.labels?.textStyle, chartStyle, fallbacks);
    apply(plot.labels, 'dataLabels', chartStyle, fallbacks);
    for (const series of plot.series ?? []) {
      const seriesShown = plot.labels
        ? layer(series.labels?.textStyle, plotShown)
        : resolve('dataLabels', series.labels?.textStyle, chartStyle, fallbacks);
      if (series.labels && plot.labels) {
        setStyle(series.labels, minimizeAgainst(series.labels.textStyle, plotShown));
      }
      else {
        apply(series.labels, 'dataLabels', chartStyle, fallbacks);
      }
      for (const point of series.points ?? []) {
        if (point.label) {
          setStyle(point.label, minimizeAgainst(point.label.textStyle, seriesShown));
        }
      }
      for (const trendline of series.trendlines ?? []) {
        apply(trendline.label, 'trendlineLabel', chartStyle, fallbacks);
      }
    }
  }
  apply(chart.dataTable, 'dataTable', chartStyle, fallbacks);

  // Every element's default is the minor font, not bold, and not italic, so the chart-wide style
  // doesn't need to say so.
  if (chartStyle) {
    if (chartStyle.fontScheme === 'minor' && !chartStyle.fontFamily) { delete chartStyle.fontScheme; }
    if (chartStyle.bold === false) { delete chartStyle.bold; }
    if (chartStyle.italic === false) { delete chartStyle.italic; }
    if (!Object.keys(chartStyle).length) { delete chart.textStyle; }
  }
}
