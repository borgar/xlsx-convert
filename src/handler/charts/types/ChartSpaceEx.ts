import type { Shape } from '@jsfkit/types';
import type { TextProps } from './TextProps.ts';
import type { ChartEx } from './ChartEx.ts';
import type { ChartData } from './dataEx/ChartData.ts';

export type ChartSpaceEx = {
  version: string;
  featureList: string;
  fallbackImg: string;
  chartData: ChartData;
  chart: ChartEx;
  shape?: Shape;
  textProps?: TextProps;
  // clrMapOvr?: ColorMapping;
  // fmtOvrs?: FormatOverrides;
  // printSettings?: PrintSettings;
};
