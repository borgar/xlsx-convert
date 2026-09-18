import type { CrossBetween } from './CrossBetween.ts';
import type { AxShared } from './AxShared.ts';
import type { DispUnits } from './DispUnits.ts';

export type ValAx = AxShared & {
  type: 'valAx';
  crossBetween?: CrossBetween;
  majorUnit?: number;
  minorUnit?: number;
  dispUnits?: DispUnits;
};
