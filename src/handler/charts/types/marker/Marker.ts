import type { integer, Shape } from '@jsfkit/types';
import type { MarkerStyle } from './MarkerStyle.ts';

export type Marker = {
  symbol?: MarkerStyle;
  size?: integer;
  shape?: Shape;
};
