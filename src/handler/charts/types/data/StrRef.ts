import type { StrData } from './StrData.ts';

/**
 *
 */
export type StrRef = {
  type: 'strRef',
  f: string;
  strCache?: StrData;
};
