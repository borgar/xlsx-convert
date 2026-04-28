import type { Shape } from '@jsfkit/types';
import type { NumFmt } from '../NumFmt.ts';
import type { TextProps } from '../TextProps.ts';
import type { integer } from '../integer.ts';
import type { DataLabelPos } from './DataLabelPos.ts';
import type { DataLabelVisibilities } from './DataLabelVisibilities.ts';
import type { DataLabel } from './DataLabel.ts';

export type DataLabels = {
  pos: DataLabelPos;
  numFmt?: NumFmt;
  shape?: Shape;
  textProps?: TextProps;
  visibility?: DataLabelVisibilities;
  separator?: string;
  dataLabel?: DataLabel[];
  dataLabelHidden?: integer[];
};
