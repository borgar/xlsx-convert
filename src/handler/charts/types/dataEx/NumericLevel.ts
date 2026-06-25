import type { integer } from '@jsfkit/types';

export type NumericLevel = {
  ptCount: integer;
  formatCode: string;
  name: string;
  pt?: { idx: integer; v: string }[];
};
