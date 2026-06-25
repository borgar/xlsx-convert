import type { Grouping } from './Grouping.ts';
import type { ChartLines } from './ChartLines.ts';
import type { UpDownBars } from './UpDownBars.ts';
import type { DLbls } from '../datalabels/DLbls.ts';
import type { Series } from '../series/Series.ts';
import type { integer } from '@jsfkit/types';

export type LineChartShared = {
  /** @default "standard" */
  grouping: Grouping;
  varyColors?: boolean;
  ser?: Series[];
  dLbls?: DLbls;
  dropLines?: ChartLines;
};

export type LineChart = LineChartShared & {
  type: 'line',
  hiLowLines?: ChartLines;
  upDownBars?: UpDownBars;
  marker?: boolean;
  // XXX: find out what method Excel uses and make enum: 'none', 'basis'
  smooth?: boolean;
  axId: [ integer, integer ];
};

export type LineChart3d = LineChartShared & {
  type: 'line3d',
  /**
   * @min 0
   * @max 500
   * @default "150%"
   */
  gapDepth?: integer;
  axId: [ integer, integer, integer ];
};
