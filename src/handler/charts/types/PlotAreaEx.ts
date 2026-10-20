import type { Shape } from '@jsfkit/types';
import type { AxisEx } from './axes/AxisEx.ts';
import type { SeriesEx } from './seriesEx/SeriesEx.ts';

export type PlotAreaEx = {
  // the plot area region's fill and outline (`cx:plotSurface`)
  plotSurface?: Shape;
  series: SeriesEx[];
  axes: AxisEx[];
  shape?: Shape;
};
