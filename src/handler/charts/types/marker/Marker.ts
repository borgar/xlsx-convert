import type { Shape } from '@jsfkit/types';
import type { MarkerStyle } from './MarkerStyle.ts';
import type { integer } from '../integer.ts';

/**
 *
 */
export type Marker = {
  symbol?: MarkerStyle;
  /**
   * @min 2
   * @max 72
   * @defaultValue 5
   */
  size?: integer;
  shape?: Shape;
};
