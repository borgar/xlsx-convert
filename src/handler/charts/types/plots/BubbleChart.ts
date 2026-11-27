import type { integer } from '@jsfkit/types';
import type { DLbls } from '../datalabels/DLbls.ts';
import type { Series } from '../series/Series.ts';
import type { SizeRepresents } from './SizeRepresents.ts';

export type BubbleChart = {
  type: 'bubble';
  varyColors?: boolean;
  ser?: Series[];
  dLbls?: DLbls;
  bubble3D?: boolean;
  bubbleScale?: integer;
  showNegBubbles?: boolean;
  sizeRepresents?: SizeRepresents;
  axId: [ integer, integer ];
};
