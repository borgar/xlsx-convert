import type { integer } from '../integer.ts';
import type { DLbls } from '../datalabels/DLbls.ts';
import type { BarShape } from './BarShape.ts';
import type { BarDir } from './BarDir.ts';
import type { ChartLines } from './ChartLines.ts';
import type { BarGrouping } from './BarGrouping.ts';
import type { BarSer } from '../series/BarSer.ts';

export type BarChartShared = {
  barDir: BarDir;
  /** @default "clustered" */
  grouping?: BarGrouping;
  varyColors?: boolean;
  ser?: BarSer[];
  dLbls?: DLbls;
};

export type BarChart = BarChartShared & {
  type: 'bar';
  /**
   * @min 0
   * @max 500
   * @default "150%"
   */
  gapWidth?: integer;
  /**
   * @min -100
   * @max 100
   * @default "0%"
   */
  overlap?: integer;
  serLines?: ChartLines[];
  axId: [ integer, integer ];
};

export type BarChart3d = BarChartShared & {
  type: 'bar3d';
  /**
   * @min 0
   * @max 500
   * @default "150%"
   */
  gapWidth?: integer;
  /**
   * @min 0
   * @max 500
   * @default "150%"
   */
  gapDepth?: integer;
  // XXX: conflicts with DML shape prop
  shape?: BarShape;
  axId: [ integer, integer ] | [ integer, integer, integer ];
};
