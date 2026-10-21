import type { integer, Shape } from '@jsfkit/types';
import type { PictureOptions } from '../plots/PictureOptions.ts';

export type Surface = {
  thickness?: integer;
  shape?: Shape;
  pictureOptions?: PictureOptions;
};
