import type { DLbls } from '../datalabels/DLbls.ts';
import type { DPt } from '../datalabels/DPt.ts';
import type { AxDataSource } from '../data/AxDataSource.ts';
import type { NumDataSource } from '../data/NumDataSource.ts';
import type { Marker } from '../marker/Marker.ts';
import type { SerShared } from './SerShared.ts';

/**
 *
 */
export type RadarSer = SerShared & {
  marker?: Marker;
  dPt?: DPt[];
  dLbls?: DLbls;
  cat?: AxDataSource;
  val?: NumDataSource;
};
