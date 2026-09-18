import type { DLbls } from '../datalabels/DLbls.ts';
import type { DPt } from '../datalabels/DPt.ts';
import type { AxDataSource } from '../data/AxDataSource.ts';
import type { NumDataSource } from '../data/NumDataSource.ts';
import type { ErrBars } from '../errorbars/ErrBars.ts';
import type { SerShared } from './SerShared.ts';
import type { Trendline } from '../trendline/Trendline.ts';

/**
 *
 */
export type BubbleSer = SerShared & {
  invertIfNegative?: boolean;
  dPt?: DPt[];
  dLbls?: DLbls;
  trendline?: Trendline[];
  errBars?: ErrBars[];
  xVal?: AxDataSource;
  yVal?: NumDataSource;
  bubbleSize?: NumDataSource;
  bubble3D?: boolean;
};
