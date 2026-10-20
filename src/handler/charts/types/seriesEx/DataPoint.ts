import type { integer, Shape } from '@jsfkit/types';

export type DataPoint = {
  idx: integer;
  shape?: Shape;
  bubble3D?: boolean;
  explosion?: integer;
};
