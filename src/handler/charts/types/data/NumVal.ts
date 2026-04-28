import type { integer } from '../integer.ts';

/**
 *
 */
export type NumVal = {
  idx: integer;
  v: string; // XXX: originally typed as ST_Xstring ... is this right?
  formatCode?: string;
};
