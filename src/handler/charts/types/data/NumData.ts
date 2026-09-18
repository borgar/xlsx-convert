import type { integer } from '@jsfkit/types';
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
