import type { Percentage } from '@jsfkit/types';
import type { integer } from '../integer.ts';

export type View3d = {
  /**
   * @min -90
   * @max 90
   * @default 0
   */
  rotX?: integer;
  /**
   * @min 5
   * @max 500
   * @default 100
   */
  hPercent?: Percentage;
  /**
   * @min 0
   * @max 360
   * @default 0
   */
  rotY?: number;
  /**
   * @min 20
   * @max 2000
   * @default "100%"
   */
  depthPercent?: Percentage;
  rAngAx?: boolean;
  /**
   * @min 0
   * @max 240
   * @default 30
   */
  perspective?: integer;
};
