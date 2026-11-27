import type { Shape, integer } from '@jsfkit/types';
import type { TextProps } from './TextProps.ts';
import type { Chart } from './Chart.ts';

export type ChartSpace = {
  roundedCorners?: boolean;
  style?: integer;
  chart: Chart;
  shape?: Shape;
  textProps?: TextProps;
};
