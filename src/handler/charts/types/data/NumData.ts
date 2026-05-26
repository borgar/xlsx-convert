import type { integer } from '../integer.ts';
import type { NumVal } from './NumVal.ts';

/**
 *
 */
export type NumData = {
  type: 'numData',
  formatCode?: string;
  ptCount?: integer;
  pt?: NumVal[];
};
