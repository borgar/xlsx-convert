import type { Chart, ChartDataLabels, ChartMarker, Shape } from '@jsfkit/types';

// An override (a point over its series, a series' labels over its plot's) sets only what it
// changes, and each property it leaves out comes from the level above (spec section 2.7). Excel
// writes overrides in full, so an importer can leave out the properties that repeat the level
// above. Fills, lines, colors, and lists are single values, compared whole. Text styles are reduced
// by the text cascade (textCascade.ts), so they're left alone here.

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function reduceShape (own: Shape | undefined, parent: Shape | undefined): Shape | undefined {
  if (!own) { return; }
  const out: Shape = { ...own };
  if (parent && 'fill' in own && same(own.fill, parent.fill)) { delete out.fill; }
  if (parent && 'line' in own && same(own.line, parent.line)) { delete out.line; }
  return Object.keys(out).length ? out : undefined;
}

function reduceMarker (own: ChartMarker | undefined, parent: ChartMarker | undefined): ChartMarker | undefined {
  if (!own) { return; }
  const out: ChartMarker = { ...own };
  if (parent) {
    if (own.symbol != null && own.symbol === parent.symbol) { delete out.symbol; }
    if (own.size != null && own.size === parent.size) { delete out.size; }
    const shape = reduceShape(own.shape, parent.shape);
    if (shape) { out.shape = shape; }
    else { delete out.shape; }
  }
  return Object.keys(out).length ? out : undefined;
}

/** Merge labels, from the most general to the most specific. */
function mergeLabels (...levels: (ChartDataLabels | undefined)[]): ChartDataLabels | undefined {
  let out: ChartDataLabels | undefined;
  for (const level of levels) {
    if (!level) { continue; }
    const merged: ChartDataLabels = { ...out, ...level };
    if (out?.shape || level.shape) { merged.shape = { ...out?.shape, ...level.shape }; }
    out = merged;
  }
  return out;
}

function reduceLabels<T extends ChartDataLabels> (
  own: T | undefined,
  parent: ChartDataLabels | undefined,
): T | undefined {
  if (!own || !parent) { return own; }
  const out: T = { ...own };
  for (const key of Object.keys(own) as (keyof ChartDataLabels)[]) {
    if (key === 'textStyle' || key === 'shape') { continue; }
    if (same(own[key], parent[key])) { delete out[key]; }
  }
  const shape = reduceShape(own.shape, parent.shape);
  if (shape) { out.shape = shape; }
  else { delete out.shape; }
  return out;
}

/**
 * Leave out a series marker's `symbol` and `size` where they're the defaults. This runs after the
 * point markers are reduced, because a point's marker is compared with its series' marker as set.
 * An empty marker stays: it shows automatic markers, where no marker leaves it to the plot.
 */
function dropDefaultMarkers (chart: Chart) {
  for (const plot of chart.plots) {
    for (const series of plot.series) {
      if (series.marker?.symbol === 'auto') { delete series.marker.symbol; }
      if (series.marker?.size === 5) { delete series.marker.size; }
    }
  }
}

/**
 * Leave out the override properties that repeat what the level above already gives: in each
 * series' labels, and in each point's shape, marker, and label. A point left with nothing but its
 * index is removed.
 */
export function reduceOverrides (chart: Chart) {
  for (const plot of chart.plots) {
    for (const series of plot.series) {
      // the labels a point's label overrides, before the series' labels are reduced
      const pointLabelParent = mergeLabels(plot.labels, series.labels);
      if (series.labels && plot.labels) {
        // labels that add nothing to the plot's are the same as none
        const labels = reduceLabels(series.labels, plot.labels);
        if (labels && Object.keys(labels).length) { series.labels = labels; }
        else { delete series.labels; }
      }
      if (!series.points) { continue; }
      for (const point of series.points) {
        const shape = reduceShape(point.shape, series.shape);
        if (shape) { point.shape = shape; }
        else { delete point.shape; }
        const marker = reduceMarker(point.marker, series.marker);
        if (marker) { point.marker = marker; }
        else { delete point.marker; }
        if (point.label) {
          const label = reduceLabels(point.label, pointLabelParent);
          if (label && Object.keys(label).length) { point.label = label; }
          else { delete point.label; }
        }
      }
      series.points = series.points.filter(p => Object.keys(p).length > 1);
      if (!series.points.length) { delete series.points; }
    }
  }
  dropDefaultMarkers(chart);
}
