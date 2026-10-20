import type { DLbls } from '../datalabels/DLbls.ts';
import type { DPt } from '../datalabels/DPt.ts';
import type { AxDataSource } from '../data/AxDataSource.ts';
import type { NumDataSource } from '../data/NumDataSource.ts';
import type { PictureOptions } from '../plots/PictureOptions.ts';
import type { Trendline } from '../trendline/Trendline.ts';
import type { ErrBars } from '../errorbars/ErrBars.ts';
import type { integer, Shape } from '@jsfkit/types';
import type { BarShape } from '../plots/BarShape.ts';
import type { Marker } from '../marker/Marker.ts';
import type { StrRef } from '../data/StrRef.ts';

export type Series = {
  idx: integer;
  order: integer;
  text?: StrRef | string;
  shape?: Shape;
  dPt?: DPt[];
  dLbls?: DLbls;
  pictureOptions?: PictureOptions;
  barShape?: BarShape;
  trendline?: Trendline[];
  errBars?: ErrBars[];
  marker?: Marker;
  explosion?: integer;
  smooth?: boolean;
  bubbleSize?: NumDataSource;
  bubble3D?: boolean;
  invertIfNegative?: boolean;
  cat?: AxDataSource;
  val?: NumDataSource;
  // filtered out with Excel's chart filter (a `c15:filtered…Series` extension)
  hidden?: boolean;
  // the range data labels take their text from (`c15:datalabelsRange`), normalized
  labelsRange?: string;
};
