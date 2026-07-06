import type { NumData } from './NumData.ts';

/**
 *
 */
export type NumRef = {
  type: 'numRef',
  f: string;
  numCache?: NumData;
};
