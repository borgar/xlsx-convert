import type { OfPieType } from './OfPieType.ts';
import type { SplitType } from '../SplitType.ts';
import type { ChartLines } from './ChartLines.ts';
import type { CustSplit } from './CustSplit.ts';
import type { integer } from '../integer.ts';
import type { PieSer } from '../series/PieSer.ts';
import type { DLbls } from '../datalabels/DLbls.ts';

export type PieChartShared = {
  varyColors?: boolean;
  ser?: PieSer[];
  dLbls?: DLbls;
};

export type PieChart = PieChartShared & {
  type: 'pie';
  /**
   * @min 0
   * @max 360
   * @default 0
   */
  firstSliceAng?: number;
};

export type OfPieChart = PieChartShared & {
  type: 'ofPie';
  ofPieType: OfPieType;
  /**
   * @min 0
   * @max 500
   * @default "150%"
   */
  gapWidth?: integer;
  splitType?: SplitType;
  splitPos?: number;
  custSplit?: CustSplit;
  /**
   * @min 5
   * @max 200
   * @default "75%"
   */
  secondPieSize?: integer;
  serLines?: ChartLines[];
};

export type PieChart3d = PieChartShared & {
  type: 'pie3d'
};

// XXX: why have a type at all?
export type DoughnutChart = PieChartShared & {
  type: 'doughnut';
  firstSliceAng?: number;
  /**
   * @min 1
   * @max 90
   * @default "10%"
   */
  holeSize?: integer;
};
