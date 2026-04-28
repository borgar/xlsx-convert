import type { Shape } from '@jsfkit/types';
import type { PictureOptions } from '../plots/PictureOptions.ts';
import type { integer } from '../integer.ts';

export type Surface = {
  /**
   * @min 0
   */
  thickness?: integer;
  shape?: Shape;
  pictureOptions?: PictureOptions;
};
