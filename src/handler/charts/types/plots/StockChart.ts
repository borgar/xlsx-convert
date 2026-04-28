import type { DLbls } from '../datalabels/DLbls.ts';
import type { LineSer } from '../series/LineSer.ts';
import type { ChartLines } from './ChartLines.ts';
import type { UpDownBars } from './UpDownBars.ts';
type integer = number;
/**
 *
 */
export type StockChart = {
  type: 'stock';
  ser: [ LineSer, LineSer, LineSer ] | [ LineSer, LineSer, LineSer, LineSer ];
  dLbls?: DLbls;
  dropLines?: ChartLines;
  hiLowLines?: ChartLines;
  upDownBars?: UpDownBars;
  axId: [ integer, integer ];
};
