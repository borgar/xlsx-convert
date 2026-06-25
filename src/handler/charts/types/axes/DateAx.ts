import type { Percentage } from '@jsfkit/types';
import type { AxShared } from './AxShared.ts';
import type { TimeUnit } from './TimeUnit.ts';

export type DateAx = AxShared & {
  type: 'dateAx';
  auto?: boolean;
  /**
   * @min 0
   * @max 100
   */
  lblOffset?: Percentage;
  /**
   * @default "days"
   */
  baseTimeUnit?: TimeUnit;
  majorUnit?: number;
  /**
   * @default "days"
   */
  majorTimeUnit?: TimeUnit;
  minorUnit?: number;
  /**
   * @default "days"
   */
  minorTimeUnit?: TimeUnit;
};
