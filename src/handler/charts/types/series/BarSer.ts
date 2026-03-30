import type { DLbls } from '../datalabels/DLbls.ts';
import type { DPt } from '../datalabels/DPt.ts';
import type { AxDataSource } from '../data/AxDataSource.ts';
import type { NumDataSource } from '../data/NumDataSource.ts';
import type { ErrBars } from '../errorbars/ErrBars.ts';
import type { SerShared } from './SerShared.ts';
import type { Trendline } from '../trendline/Trendline.ts';
import type { BarShape } from '../plots/BarShape.ts';
import type { PictureOptions } from '../plots/PictureOptions.ts';

export type BarSer = SerShared & {
  invertIfNegative?: boolean;
  pictureOptions?: PictureOptions;
  dPt?: DPt[];
  dLbls?: DLbls;
  trendline?: Trendline[];
  errBars?: ErrBars;
  cat?: AxDataSource;
  val?: NumDataSource;
  shape?: BarShape;
};
