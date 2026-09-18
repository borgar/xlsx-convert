import type { integer, Shape } from '@jsfkit/types';
import type { Marker } from '../marker/Marker.ts';
import type { PictureOptions } from '../plots/PictureOptions.ts';

/**
 *
 */
export type DPt = {
  idx: integer;
  invertIfNegative?: boolean;
  marker?: Marker;
  bubble3D?: boolean;
  explosion?: integer;
  shape?: Shape;
  pictureOptions?: PictureOptions;
};
