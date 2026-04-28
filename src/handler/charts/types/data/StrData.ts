import type { integer } from '../integer.ts';
import type { StrVal } from './StrVal.ts';

export type StrData = {
  ptCount?: integer;
  pt?: StrVal[];
};
