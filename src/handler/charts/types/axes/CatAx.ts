import type { integer, Percentage } from '@jsfkit/types';
import type { LblAlgn } from './LblAlgn.ts';
import type { AxShared } from './AxShared.ts';

export type CatAx = AxShared & {
  type: 'catAx';
  auto?: boolean;
  lblAlgn?: LblAlgn;
  lblOffset?: Percentage;
  tickLblSkip?: integer;
  tickMarkSkip?: integer;
  noMultiLvlLbl?: boolean;
};
