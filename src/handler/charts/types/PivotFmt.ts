import type { Shape } from '@jsfkit/types';
import type { integer } from './integer.ts';
import type { Marker } from './marker/Marker.ts';
import type { DLbl } from './datalabels/DLbl.ts';
import type { TextProps } from './TextProps.ts';

export type PivotFmt = {
  idx: integer;
  shape?: Shape;
  textProps?: TextProps;
  marker?: Marker;
  dLbl?: DLbl;
};
