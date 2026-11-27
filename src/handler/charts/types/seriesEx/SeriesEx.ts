import type { integer, Shape } from '@jsfkit/types';
import type { SeriesLayout } from './SeriesLayout.ts';
import type { DataPoint } from './DataPoint.ts';
import type { DataLabels } from './DataLabels.ts';
import type { SeriesLayoutProperties } from './SeriesLayoutProperties.ts';
import type { Text } from '../Text.ts';

export type SeriesEx = {
  layoutId: SeriesLayout;
  hidden?: boolean;
  ownerIdx?: integer;
  formatIdx?: integer;
  text?: Text;
  shape?: Shape;
  dataPt?: DataPoint[];
  dataLabels?: DataLabels;
  dataId?: integer;
  layoutPr?: SeriesLayoutProperties;
  axisId?: integer[];
};
