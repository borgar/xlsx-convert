import type { ChartLines } from './ChartLines.ts';
import type { Grouping } from './Grouping.ts';
import type { DLbls } from '../datalabels/DLbls.ts';
import type { Series } from '../series/Series.ts';
import type { integer } from '@jsfkit/types';

export type AreaChartShared = {
  axId: [ integer, integer ];
  grouping?: Grouping;
  varyColors?: boolean;
  ser?: Series[];
  dLbls?: DLbls;
  dropLines?: ChartLines;
};

export type AreaChart = AreaChartShared & {
  type: 'area';
};

export type AreaChart3d = AreaChartShared & {
  type: 'area3d';
  gapDepth?: integer;
  axId: [ integer, integer ] | [ integer, integer, integer ];
};
