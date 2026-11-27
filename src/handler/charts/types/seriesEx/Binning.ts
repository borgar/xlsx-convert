import type { integer } from '@jsfkit/types';

export type Binning = {
  type: 'binning';
  binSize?: number;
  binCount?: integer;
  intervalClosed?: 'l' | 'r';
  underflow?: number | 'auto';
  overflow?: number | 'auto';
};
