import type { integer } from '@jsfkit/types';

export type StringLevel = {
  ptCount: integer;
  name: string;
  pt?: { idx: integer; v: string }[];
};
