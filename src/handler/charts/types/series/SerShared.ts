import type { integer, Shape } from '@jsfkit/types';
import type { SerTx } from './SerTx.ts';

export type SerShared = {
  idx: integer;
  order: integer;
  text?: SerTx;
  shape?: Shape;
};
