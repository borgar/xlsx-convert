import type { Grouping } from './Grouping.ts';
import type { ChartLines } from './ChartLines.ts';
import type { integer } from '../integer.ts';
import type { UpDownBars } from './UpDownBars.ts';
import type { LineSer } from '../series/LineSer.ts';
import type { DLbls } from '../datalabels/DLbls.ts';

export type LineChartShared = {
  /** @default "standard" */
  grouping: Grouping;
  varyColors?: boolean;
  ser?: LineSer[];
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
