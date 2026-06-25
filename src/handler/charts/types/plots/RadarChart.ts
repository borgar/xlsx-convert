import type { integer } from '@jsfkit/types';
import type { DLbls } from '../datalabels/DLbls.ts';
import type { Series } from '../series/Series.ts';
import type { RadarStyle } from './RadarStyle.ts';

/**
 *
 */
export type RadarChart = {
  type: 'radar';
  radarStyle: RadarStyle;
  varyColors?: boolean;
  ser?: Series[];
  dLbls?: DLbls;
  axId: [ integer, integer ];
};
