import type { Percentage } from '@jsfkit/types';
import type { LblAlgn } from './LblAlgn.ts';
import type { AxShared } from './AxShared.ts';
type integer = number;

// extends SerAx?
export type CatAx = AxShared & {
  type: 'catAx';
  auto?: boolean;
  lblAlgn?: LblAlgn;
  /**
   * @min 0
   * @max 1000
   * @default 100
   */
  lblOffset?: Percentage;
  /**
   * @min 1
   */
  tickLblSkip?: integer;
  /**
   * @min 1
   */
  tickMarkSkip?: integer;
  noMultiLvlLbl?: boolean;
};
