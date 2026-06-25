import type { integer } from '@jsfkit/types';
import type { NumericDimension } from './NumericDimension.ts';

export type DataNum = {
  type: 'num';
  id: integer;
  dim: NumericDimension;
};
