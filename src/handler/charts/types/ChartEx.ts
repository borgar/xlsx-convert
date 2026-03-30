import type { LegendEx } from './legend/LegendEx.ts';
import type { PlotAreaEx } from './PlotAreaEx.ts';
import type { Title } from './Title.ts';

export type ChartEx = {
  title?: Title;
  plotArea?: PlotAreaEx;
  // Legends seem like they can be mostly merged?
  legend?: LegendEx;
};
