import type { Legend } from './legend/Legend.ts';
import type { PlotAreaEx } from './PlotAreaEx.ts';
import type { Title } from './Title.ts';

export type ChartEx = {
  type: 'ex';
  title?: Title;
  plotArea?: PlotAreaEx;
  // Legends seem like they can be mostly merged?
  legend?: Legend;
};
