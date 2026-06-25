import type { Formula } from './Formula.ts';
import type { NumericDimensionType } from './NumericDimensionType.ts';
import type { NumericLevel } from './NumericLevel.ts';

export type NumericDimension = {
  type: NumericDimensionType;
  f: Formula;
  nf?: Formula;
  lvl?: NumericLevel[];
};
