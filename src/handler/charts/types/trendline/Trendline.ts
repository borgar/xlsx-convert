import type { Shape } from '@jsfkit/types';
import type { TrendlineType } from './TrendlineType.ts';
import type { TrendlineLbl } from './TrendlineLbl.ts';
type integer = number;

/**
 *
 */
export type Trendline = {
  name?: string;
  shape?: Shape;
  type: TrendlineType; // org: trendlineType
  /**
   * @min 2
   * @max 6
   * @default 2
   */
  order?: integer;
  /**
   * @min 2
   * @default 2
   */
  period?: integer;
  forward?: number;
  backward?: number;
  intercept?: number;
  dispRSqr?: boolean;
  dispEq?: boolean;
  // trendlineLbl?: TrendlineLbl;
  label?: TrendlineLbl;
};
