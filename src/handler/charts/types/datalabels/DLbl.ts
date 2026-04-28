import type { Group_DLbl } from './Group_DLbl.ts';

type integer = number;

/**
 *
 */
export type DLbl =
  { idx: integer, delete: boolean } |
  { idx: integer } & Group_DLbl;
