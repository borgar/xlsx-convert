import type { AxDataSource } from '../data/AxDataSource.ts';
import type { NumDataSource } from '../data/NumDataSource.ts';
import type { SerShared } from './SerShared.ts';

/**
 *
 */
export type SurfaceSer = SerShared & {
  cat?: AxDataSource;
  val?: NumDataSource;
};
