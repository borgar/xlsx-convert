import type { integer } from '../integer.ts';
import type { ChartLines } from './ChartLines.ts';
import type { Grouping } from './Grouping.ts';
import type { DLbls } from '../datalabels/DLbls.ts';
import type { Series } from '../series/Series.ts';

type AreaChartShared = {
  axId: [ integer, integer ];
  grouping?: Grouping; // default is "standard"
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
  // when read we should parse string "100%" to number ... default when read is "150%"
  /**
   * @min 0
   * @max 500
   */
  gapDepth?: integer;
  axId: [ integer, integer ] | [ integer, integer, integer ];
};
