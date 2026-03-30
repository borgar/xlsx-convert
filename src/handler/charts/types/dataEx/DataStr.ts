import type { integer } from '../integer.ts';
import type { StringDimension } from './StringDimension.ts';

export type DataStr = {
  type: 'str';
  id: integer;
  dim: StringDimension;
};
