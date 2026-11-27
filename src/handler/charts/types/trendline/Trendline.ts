import type { integer, Shape } from '@jsfkit/types';
import type { TrendlineType } from './TrendlineType.ts';
import type { TrendlineLbl } from './TrendlineLbl.ts';

export type Trendline = {
  name?: string;
  shape?: Shape;
  type: TrendlineType;
  order?: integer;
  period?: integer;
  forward?: number;
  backward?: number;
  intercept?: number;
  dispRSqr?: boolean;
  dispEq?: boolean;
  label?: TrendlineLbl;
};
