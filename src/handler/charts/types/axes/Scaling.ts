import type { Orientation } from './Orientation.ts';

export type Scaling = {
  /**
   * @min 2
   * @max 1000
   */
  logBase?: number;
  /**
   * @default "minMax"
   */
  orientation?: Orientation;
  max?: number;
  min?: number;
};
