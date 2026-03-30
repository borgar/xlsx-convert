import type { Shape } from '@jsfkit/types';
import type { Series } from './seriesEx/Series.ts';

// can this be collapsed into PlotAreaEx?
export type PlotAreaRegion = {
  plotSurface?: Shape;
  series: Series[];
};
