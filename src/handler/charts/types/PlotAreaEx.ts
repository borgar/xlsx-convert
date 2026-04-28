import type { Shape } from '@jsfkit/types';
import type { PlotAreaRegion } from './PlotAreaRegion.ts';
import type { AxisEx } from './axes/AxisEx.ts';

export type PlotAreaEx = {
  plotAreaRegion: PlotAreaRegion,
  axis?: AxisEx[];
  // Excel seems to save shape props for Plot Area as plotAreaRegion.plotSurface.spPr
  shape?: Shape;
};
