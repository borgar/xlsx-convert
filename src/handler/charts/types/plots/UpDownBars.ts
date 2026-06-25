import type { integer, Shape } from '@jsfkit/types';

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
