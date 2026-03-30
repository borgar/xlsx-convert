import type { Shape } from '@jsfkit/types';
import type { integer } from '../integer.ts';
import type { NumFmt } from '../NumFmt.ts';
import type { DataLabelPos } from './DataLabelPos.ts';
import type { TextProps } from '../TextProps.ts';
import type { DataLabelVisibilities } from './DataLabelVisibilities.ts';

export type DataLabel = {
  idx: integer;
  pos: DataLabelPos;
  numFmt?: NumFmt;
  shape?: Shape;
  textProps?: TextProps;
  visibility?: DataLabelVisibilities;
  separator?: string;
};
