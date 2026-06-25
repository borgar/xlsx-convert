import type { integer, Shape } from '@jsfkit/types';
import type { PictureOptions } from '../plots/PictureOptions.ts';

export type Surface = {
  /**
   * @min 0
   */
  thickness?: integer;
  shape?: Shape;
  pictureOptions?: PictureOptions;
};
