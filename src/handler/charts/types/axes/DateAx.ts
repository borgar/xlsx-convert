import type { Percentage } from '@jsfkit/types';
import type { AxShared } from './AxShared.ts';
import type { TimeUnit } from './TimeUnit.ts';

export type DateAx = AxShared & {
  type: 'dateAx';
  auto?: boolean;
  lblOffset?: Percentage;
  baseTimeUnit?: TimeUnit;
  majorUnit?: number;
  majorTimeUnit?: TimeUnit;
  minorUnit?: number;
  minorTimeUnit?: TimeUnit;
};
