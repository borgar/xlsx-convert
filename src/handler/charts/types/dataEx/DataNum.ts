import type { integer } from '../integer.ts';
import type { NumericDimension } from './NumericDimension.ts';

export type DataNum = {
  type: 'num';
  id: integer;
  dim: NumericDimension;
};
