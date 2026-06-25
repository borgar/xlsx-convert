import type { integer } from '@jsfkit/types';

/**
 *
 */
export type NumVal = {
  idx: integer;
  v: string; // XXX: originally typed as ST_Xstring ... is this right?
  formatCode?: string;
};
