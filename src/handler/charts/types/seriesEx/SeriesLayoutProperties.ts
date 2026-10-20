import type { Aggregation } from './Aggregation.ts';
import type { Binning } from './Binning.ts';
import type { SeriesElementVisibilities } from './SeriesElementVisibilities.ts';
import type { Statistics } from './Statistics.ts';
import type { Subtotals } from './Subtotals.ts';

export type SeriesLayoutProperties = {
  parentLabelLayout?: 'none' | 'banner' | 'overlapping';
  visibility?: SeriesElementVisibilities;
  statistics?: Statistics;
  subtotals?: Subtotals;
  aggregation?: Aggregation;
  binning?: Binning;
};
