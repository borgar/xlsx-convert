import type { Formula } from './Formula.ts';
import type { StringLevel } from './StringLevel.ts';

export type StringDimension = {
  type: 'cat' | 'colorStr' | 'entityId';
  f: Formula;
  nf?: Formula;
  lvl?: StringLevel[];
};
