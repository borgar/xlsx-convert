import type { integer } from '../integer.ts';
import type { Lvl } from './Lvl.ts';

/**
 *
 */
export type MultiLvlStrData = {
  ptCount?: integer;
  lvl?: Lvl[];
};
