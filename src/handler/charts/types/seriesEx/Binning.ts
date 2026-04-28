import type { integer } from '../integer.ts';

export type Binning = {
  type: 'binning';
  // either of:
  binSize?: number;
  binCount?: integer;
  // end either
  intervalClosed: 'l' | 'r';
  underflow: number | 'auto';
  overflow: number | 'auto';
};
