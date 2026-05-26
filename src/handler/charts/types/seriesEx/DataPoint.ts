import type { Shape } from '@jsfkit/types';
import type { integer } from '../integer.ts';

export type DataPoint = {
  idx: integer;
  shape?: Shape;
  bubble3D?: boolean;
  /**
   * Point of explosion (mark pushed away from center)
   *
   * Used by: *Pie*
   */
  explosion?: integer;
};
