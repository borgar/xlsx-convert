import type { integer } from '../integer.ts';

export type StringLevel = {
  ptCount: integer;
  name: string;
  pt?: { idx: integer; v: string }[];
};
