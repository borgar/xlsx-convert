import type { Shape } from '@jsfkit/types';
import type { integer } from '../integer.ts';

export type DataPoint = {
  idx: integer;
  shape?: Shape;
};
