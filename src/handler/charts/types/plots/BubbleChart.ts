import type { DLbls } from '../datalabels/DLbls.ts';
import type { integer } from '../integer.ts';
import type { BubbleSer } from '../series/BubbleSer.ts';
import type { SizeRepresents } from './SizeRepresents.ts';

/**
 *
 */
export type BubbleChart = {
  type: 'bubble';
  varyColors?: boolean;
  ser?: BubbleSer[];
  dLbls?: DLbls;
  bubble3D?: boolean;
  /**
   * @min 0
   * @max 300
   * @defaultValue "100%"
   */
  bubbleScale?: integer;
  showNegBubbles?: boolean;
  /**
   * @defaultValue "area"
   */
  sizeRepresents?: SizeRepresents;
  axId: [ integer, integer ];
};
