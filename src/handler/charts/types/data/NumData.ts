import type { integer } from '../integer.ts';
import type { NumVal } from './NumVal.ts';

/**
 *
 */
export type NumData = {
  formatCode?: string;
  ptCount?: integer;
  pt?: NumVal[];
};
