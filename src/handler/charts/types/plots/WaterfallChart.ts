import type { integer, Shape } from '@jsfkit/types';
import type { Series } from '../series/Series.ts';

export type WaterfallChart = {
  type: 'waterfall';
  ser: Series[];
  axId: [ integer, integer ];
  subtotals?: number[];
  connectorLines?: boolean;
  fmtOvrs?: { idx: number, shape: Shape }[];
};
