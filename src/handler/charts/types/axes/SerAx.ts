import type { integer } from '@jsfkit/types';
import type { AxShared } from './AxShared.ts';

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
