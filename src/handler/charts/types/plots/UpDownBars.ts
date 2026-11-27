import type { integer, Shape } from '@jsfkit/types';

export type UpDownBar = {
  shape?: Shape;
};

export type UpDownBars = {
  gapWidth?: integer;
  upBars?: UpDownBar;
  downBars?: UpDownBar;
};
