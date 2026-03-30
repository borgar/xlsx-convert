import type { Shape } from '@jsfkit/types';
import type { integer } from '../integer.ts';

// XXX: unwrap?
export type UpDownBar = {
  shape?: Shape;
};

/**
 *
 */
export type UpDownBars = {
  /**
   * @min 0
   * @max 500
   * @default 150
   */
  gapWidth?: integer;
  upBars?: UpDownBar;
  downBars?: UpDownBar;
};
