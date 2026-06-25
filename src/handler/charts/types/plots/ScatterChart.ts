import type { integer } from '@jsfkit/types';
import type { DLbls } from '../datalabels/DLbls.ts';
import type { Series } from '../series/Series.ts';
import type { ScatterStyle } from './ScatterStyle.ts';

/**
 *
 */
export type ScatterChart = {
  type: 'scatter';
  scatterStyle: ScatterStyle;
  varyColors?: boolean;
  ser?: Series[];
  dLbls?: DLbls;
  axId: [ integer, integer ];
};
