import type { Shape } from '@jsfkit/types';
import type { SerTx } from './SerTx.ts';
type integer = number;

export type SerShared = {
  idx: integer;
  order: integer;
  text?: SerTx;
  shape?: Shape;
};
