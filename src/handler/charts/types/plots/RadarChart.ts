import type { DLbls } from '../datalabels/DLbls.ts';
import type { integer } from '../integer.ts';
import type { RadarSer } from '../series/RadarSer.ts';
import type { RadarStyle } from './RadarStyle.ts';

/**
 *
 */
export type RadarChart = {
  type: 'radar';
  radarStyle: RadarStyle;
  varyColors?: boolean;
  ser?: RadarSer[];
  dLbls?: DLbls;
  axId: [ integer, integer ];
};
