import type { OfPieType } from './OfPieType.ts';
import type { SplitType } from '../SplitType.ts';
import type { ChartLines } from './ChartLines.ts';
import type { CustSplit } from './CustSplit.ts';
import type { DLbls } from '../datalabels/DLbls.ts';
import type { Series } from '../series/Series.ts';
import type { integer } from '@jsfkit/types';

export type PieChartShared = {
  varyColors?: boolean;
  ser?: Series[];
  dLbls?: DLbls;
};

export type PieChart = PieChartShared & {
  type: 'pie';
  firstSliceAng?: number;
};

export type OfPieChart = PieChartShared & {
  type: 'ofPie';
  ofPieType: OfPieType;
  gapWidth?: integer;
  splitType?: SplitType;
  splitPos?: number;
  custSplit?: CustSplit;
  secondPieSize?: integer;
  serLines?: ChartLines[];
};

export type PieChart3d = PieChartShared & {
  type: 'pie3d'
};

export type DoughnutChart = PieChartShared & {
  type: 'doughnut';
  firstSliceAng?: number;
  holeSize?: integer;
};
