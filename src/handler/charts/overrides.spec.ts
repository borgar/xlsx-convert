import type { Chart, ChartPlot } from '@jsfkit/types';
import { describe, it, expect } from 'vitest';
import { reduceOverrides } from './overrides.ts';

const BLUE = { type: 'solid', bg: { type: 'srgb', value: '0000FF' } } as const;
const RED = { type: 'solid', bg: { type: 'srgb', value: 'FF0000' } } as const;
const THIN = { width: 9525 };

function chartWith (plot: Partial<ChartPlot>): Chart {
  return {
    data: [],
    scales: [],
    plots: [ { id: 'p', mark: 'bar', data: 'd', encoding: {}, series: [], ...plot } ],
  };
}

describe('reduceOverrides', () => {
  it('leaves out point shape properties that repeat the series', () => {
    const chart = chartWith({
      series: [ {
        id: 's',
        shape: { fill: BLUE, line: THIN },
        points: [ { index: 0, shape: { fill: RED, line: THIN } }, { index: 1, shape: { fill: BLUE, line: THIN } } ],
      } ],
    });
    reduceOverrides(chart);
    // the second point repeats the series exactly, so nothing is left of it
    expect(chart.plots[0].series[0].points).toEqual([ { index: 0, shape: { fill: RED } } ]);
  });

  it('leaves out marker properties that repeat the series', () => {
    const chart = chartWith({
      series: [ {
        id: 's',
        marker: { symbol: 'circle', size: 7 },
        points: [ { index: 0, marker: { symbol: 'square', size: 7 } } ],
      } ],
    });
    reduceOverrides(chart);
    expect(chart.plots[0].series[0].points?.[0].marker).toEqual({ symbol: 'square' });
  });

  it('reduces series labels against the plot, and point labels against both', () => {
    const chart = chartWith({
      labels: { show: [ 'value' ], position: 'top' },
      series: [ {
        id: 's',
        labels: { show: [ 'value' ], position: 'top', separator: '; ' },
        points: [
          { index: 0, label: { show: [ 'value' ], position: 'top', separator: '; ', hidden: true } },
          { index: 1, label: { show: [ 'value' ], position: 'top', separator: '; ' } },
        ],
      } ],
    });
    reduceOverrides(chart);
    const series = chart.plots[0].series[0];
    expect(series.labels).toEqual({ separator: '; ' });
    expect(series.points).toEqual([ { index: 0, label: { hidden: true } } ]);
  });
});
