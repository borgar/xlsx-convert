import type { Shape } from '@jsfkit/types';
import type { Series } from '../series/Series.ts';

export type WaterfallChart = {
  type: 'waterfall';
  ser: Series[];
  axId: [ number, number ];
  subtotals?: number[];
  connectorLines?: boolean;
  fmtOvrs?: { idx: number, shape: Shape }[];
};
