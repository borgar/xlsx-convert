import type { Orientation } from './Orientation.ts';

export type Scaling = {
  logBase?: number;
  orientation?: Orientation;
  max?: number;
  min?: number;
};
