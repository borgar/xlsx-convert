import type { integer, Shape } from '@jsfkit/types';
import type { SeriesLayout } from './SeriesLayout.ts';
import type { SeriesLayoutProperties } from './SeriesLayoutProperties.ts';
import type { DataLabels } from './DataLabels.ts';
import type { DataPoint } from './DataPoint.ts';
import type { ValueColorPositions, ValueColors } from './ValueColor.ts';

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
