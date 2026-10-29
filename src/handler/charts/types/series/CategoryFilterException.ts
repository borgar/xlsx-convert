import type { Shape } from '@jsfkit/types';

// A point in a category filtered out with Excel's chart filter (`c15:categoryFilterException`)
export type CategoryFilterException = {
  // the point's value cell (`c15:sqref`), normalized
  ref: string;
  shape?: Shape;
};
