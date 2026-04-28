import type { integer } from '../integer.ts';
import type { ChartLines } from './ChartLines.ts';
import type { Grouping } from './Grouping.ts';
import type { AreaSer } from '../series/AreaSer.ts';
import type { DLbls } from '../datalabels/DLbls.ts';

export type AreaChart = {
  type: 'area',
  axId: [ integer, integer ];
  grouping?: Grouping; // default is "standard"
  varyColors?: boolean;
  ser?: AreaSer[];
  dLbls?: DLbls;
  dropLines?: ChartLines;
};

export type AreaChart3d = AreaChart & {
  type: 'area3d',
  // when read we should parse string "100%" to number ... default when read is "150%"
  /**
   * @min 0
   * @max 500
   */
  gapDepth?: integer;
  axId: [ integer, integer ] | [ integer, integer, integer ];
};
