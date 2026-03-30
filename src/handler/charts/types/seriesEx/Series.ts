import type { Shape } from '@jsfkit/types';
import type { integer } from '../integer.ts';
import type { SeriesLayout } from './SeriesLayout.ts';

export type Series = {
  layoutId: SeriesLayout;
  hidden: boolean;
  ownerIdx: integer;
  uniqueId: string;
  formatIdx: integer;
  text?: Text;
  shape?: Shape;
  // join these next two into { min: {color+pos}, ... } ?
  valueColors?: ValueColors;
  valueColorPositions?: ValueColorPositions;
  dataPt?: DataPoint[];
  dataLabels?: DataLabels;
  dataId?: integer;
  layoutPr?: SeriesLayoutProperties;
  axisId?: integer[];
};
