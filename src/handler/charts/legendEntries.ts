import type { Chart, ChartLegendEntryRef, ChartSeries } from '@jsfkit/types';

/**
 * How OOXML numbers a chart's legend entries (`c:legendEntry idx`), as needed to turn those
 * numbers into entry references. The numbers don't follow the order the legend lists entries in.
 *
 * - `none`: a surface chart's value band entries can't be hidden: Excel lets you delete one, but
 *   doesn't save it (confirmed). A surface chart's `c:legendEntry` elements are ignored.
 * - `point`: a pie, or a single drawn series with `varyColors`, numbers the points of one series.
 * - `series`: otherwise, each series' entry is numbered by the series' rank in `c:idx`
 *   (`colorIndex`) order, so gaps in `c:idx` don't leave gaps in the numbers. The trendlines are
 *   numbered after all the series, starting at the number of series, in series order.
 *
 * Confirmed in Excel (`chart-legend-hidden-entries.xlsx` and `chart-legend-entry-numbering.xlsx`),
 * including series whose `c:idx` and `c:order` differ, a gap in `c:idx`, and several trendlines.
 * Not confirmed: whether trendlines on series in different plots follow series order or the order the
 * plots are written in.
 */
export type LegendEntryList =
  { type: 'none' } |
  { type: 'point'; series: string } |
  { type: 'series'; entries: Map<number, ChartLegendEntryRef> };

export function legendEntryList (chart: Chart): LegendEntryList {
  if (chart.plots.some(p => p.mark === 'surface')) {
    return { type: 'none' };
  }
  const drawn = (series: ChartSeries[]) => series.filter(s => !s.hidden);
  const [ first ] = chart.plots;
  if (first && chart.plots.length === 1) {
    const shown = (first.layout?.type === 'arc' && first.layout.variant === 'doughnut') ? drawn(first.series) : drawn(first.series).slice(0, 1);
    const byPoint = first.mark === 'arc' ? first.varyColors !== false : (shown.length === 1 && first.varyColors);
    if (byPoint && shown.length) {
      return { type: 'point', series: shown[0].id };
    }
  }

  // a series without a colorIndex has its position in series order
  const all = chart.plots.flatMap(p => p.series);
  const byOrder = [ ...all ].sort((a, b) => (a.order ?? all.indexOf(a)) - (b.order ?? all.indexOf(b)));
  const colorIndex = (s: ChartSeries) => s.colorIndex ?? byOrder.indexOf(s);
  const entries = new Map<number, ChartLegendEntryRef>();
  // series by their rank in colorIndex order, then trendlines in series order
  [ ...all ].sort((a, b) => colorIndex(a) - colorIndex(b))
    .forEach((series, rank) => entries.set(rank, { series: series.id }));
  let next = all.length;
  for (const series of byOrder) {
    (series.trendlines ?? []).forEach((_, trendline) => entries.set(next++, { series: series.id, trendline }));
  }
  return { type: 'series', entries };
}

/** The entry that an OOXML legend entry number refers to, if any. */
export function legendEntryRef (list: LegendEntryList, idx: number): ChartLegendEntryRef | undefined {
  if (list.type === 'none') {
    return;
  }
  if (list.type === 'point') {
    return { series: list.series, point: idx };
  }
  return list.entries.get(idx);
}
