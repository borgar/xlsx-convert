import type { DLbls } from '../datalabels/DLbls.ts';
import type { DPt } from '../datalabels/DPt.ts';
import type { AxDataSource } from '../data/AxDataSource.ts';
import type { NumDataSource } from '../data/NumDataSource.ts';
import type { SerShared } from './SerShared.ts';
import type { PictureOptions } from '../plots/PictureOptions.ts';
import type { Trendline } from '../trendline/Trendline.ts';
import type { ErrBars } from '../errorbars/ErrBars.ts';

export type AreaSer = SerShared & {
  pictureOptions?: PictureOptions;
  dPt?: DPt[];
  dLbls?: DLbls;
  trendline?: Trendline[];
  errBars?: ErrBars[];
  cat?: AxDataSource;
  val?: NumDataSource;
};
