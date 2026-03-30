import type { DLbls } from '../datalabels/DLbls.ts';
import type { integer } from '../integer.ts';
import type { ScatterSer } from '../series/ScatterSer.ts';
import type { ScatterStyle } from './ScatterStyle.ts';

/**
 *
 */
export type ScatterChart = {
  scatterStyle: ScatterStyle;
  varyColors?: boolean;
  ser?: ScatterSer[];
  dLbls?: DLbls;
  axId: [ integer, integer ];
};
