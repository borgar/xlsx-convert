import type { AxDataSource } from '../data/AxDataSource.ts';
import type { NumDataSource } from '../data/NumDataSource.ts';
import type { DLbls } from '../datalabels/DLbls.ts';
import type { DPt } from '../datalabels/DPt.ts';
import type { integer } from '../integer.ts';
import type { SerShared } from './SerShared.ts';

export type PieSer = SerShared & {
  explosion?: integer;
  dPt?: DPt[];
  dLbls?: DLbls;
  cat?: AxDataSource;
  val?: NumDataSource;
};
