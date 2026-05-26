import type { Shape } from '@jsfkit/types';
import type { SeriesEx } from './seriesEx/SeriesEx.ts';

// can this be collapsed into PlotAreaEx?
export type PlotAreaRegion = {
  plotSurface?: Shape;
  series: SeriesEx[];
};
