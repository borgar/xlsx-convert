import type { integer } from '@jsfkit/types';
import type { AxShared } from './AxShared.ts';

export type SerAx = AxShared & {
  type: 'serAx';
  tickLblSkip?: integer;
  tickMarkSkip?: integer;
};
