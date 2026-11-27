import type { Shape } from '@jsfkit/types';
import type { TextProps } from './TextProps.ts';
import type { ChartEx } from './ChartEx.ts';
import type { ChartDataMap } from '../readChartData.ts';

export type ChartSpaceEx = {
  data: ChartDataMap;
  chart: ChartEx;
  shape?: Shape;
  textProps?: TextProps;
  // format overrides (`cx:fmtOvrs`), by slot: colors for parts that aren't elements of their own,
  // such as a waterfall's Increase, Decrease, and Total columns
  fmtOvrs?: { idx: number, shape: Shape }[];
};
