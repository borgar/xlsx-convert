import type { integer } from '@jsfkit/types';
import type { StrVal } from './StrVal.ts';

export type StrData = {
  type: 'strData',
  ptCount?: integer;
  pt?: StrVal[];
};
