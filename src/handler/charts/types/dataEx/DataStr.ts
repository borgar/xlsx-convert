import type { integer } from '@jsfkit/types';
import type { StringDimension } from './StringDimension.ts';

export type DataStr = {
  type: 'str';
  id: integer;
  dim: StringDimension;
};
