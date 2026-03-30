import type { AxShared } from './AxShared.ts';
type integer = number;

export type SerAx = AxShared & {
  type: 'serAx';
  /**
   * @min 1
   */
  tickLblSkip?: integer;
  /**
   * @min 1
   */
  tickMarkSkip?: integer;
};
