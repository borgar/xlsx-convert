import type { DLbls } from '../datalabels/DLbls.ts';
import type { Series } from '../series/Series.ts';
import type { ChartLines } from './ChartLines.ts';
import type { UpDownBars } from './UpDownBars.ts';
type integer = number;
/**
 *
 */
export type StockChart = {
  type: 'stock';
  ser: [ Series, Series, Series ] | [ Series, Series, Series, Series ];
  dLbls?: DLbls;
  dropLines?: ChartLines;
  hiLowLines?: ChartLines;
  upDownBars?: UpDownBars;
  axId: [ integer, integer ];
};
