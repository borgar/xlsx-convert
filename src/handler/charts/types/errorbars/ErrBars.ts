import type { Shape } from '@jsfkit/types';
import type { ErrBarType } from './ErrBarType.ts';
import type { ErrDir } from './ErrDir.ts';
import type { ErrValType } from './ErrValType.ts';
import type { NumDataSource } from '../data/NumDataSource.ts';

/**
 *
 */
export type ErrBars = {
  errDir?: ErrDir;
  errBarType: ErrBarType;
  errValType: ErrValType;
  noEndCap?: boolean;
  plus?: NumDataSource;
  minus?: NumDataSource;
  val?: number;
  shape?: Shape;
};
