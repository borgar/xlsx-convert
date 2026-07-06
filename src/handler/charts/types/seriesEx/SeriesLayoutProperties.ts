import type { Geography } from '../geo/Geography.ts';
import type { Aggregation } from './Aggregation.ts';
import type { Binning } from './Binning.ts';
import type { SeriesElementVisibilities } from './SeriesElementVisibilities.ts';
import type { Statistics } from './Statistics.ts';
import type { Subtotals } from './Subtotals.ts';

export type SeriesLayoutProperties = {
  parentLabelLayout?: 'none' | 'banner' | 'overlapping';
  regionLabelLayout?: 'none' | 'bestFitOnly' | 'showAll';
  visibility?: SeriesElementVisibilities;
  geography?: Geography;
  statistics?: Statistics;
  subtotals?: Subtotals;
  // --- oneOf:
  aggregation?: Aggregation;
  binning?: Binning;
  // --- /oneOf
};
