import type { DLbls } from '../datalabels/DLbls.ts';
import type { BarShape } from './BarShape.ts';
import type { BarDir } from './BarDir.ts';
import type { ChartLines } from './ChartLines.ts';
import type { BarGrouping } from './BarGrouping.ts';
import type { Series } from '../series/Series.ts';
import type { integer } from '@jsfkit/types';

export type BarChartShared = {
  barDir: BarDir;
  grouping?: BarGrouping;
  varyColors?: boolean;
  ser?: Series[];
  dLbls?: DLbls;
};

export type BarChart = BarChartShared & {
  type: 'bar';
  gapWidth?: integer;
  overlap?: integer;
  serLines?: ChartLines[];
  axId: [ integer, integer ];
};

export type BarChart3d = BarChartShared & {
  type: 'bar3d';
  gapWidth?: integer;
  gapDepth?: integer;
  // the shape of the bars (`c:shape`), not a DrawingML shape
  shape?: BarShape;
  axId: [ integer, integer ] | [ integer, integer, integer ];
};
