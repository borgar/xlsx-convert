import type { integer } from '../integer.ts';

export type NumericLevel = {
  ptCount: integer;
  formatCode: string;
  name: string;
  pt?: integer[];
};
