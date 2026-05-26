import type { integer } from '../integer.ts';
import type { StrVal } from './StrVal.ts';

export type StrData = {
  type: 'strData',
  ptCount?: integer;
  pt?: StrVal[];
};
