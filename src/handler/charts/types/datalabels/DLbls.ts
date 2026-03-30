import type { DLbl } from './DLbl.ts';
import type { Group_DLbls } from './Group_DLbls.ts';

/**
 *
 */
export type DLbls =
  { dLbl?: DLbl[], delete: boolean } |
  { dLbl?: DLbl[] } & Group_DLbls;
