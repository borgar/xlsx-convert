import type { Data } from './Data.ts';
import type { ExternalData } from './ExternalData.ts';

export type ChartData = {
  externalData?: ExternalData;
  data?: Data[]; // min 1 occurance
};
