import type { Shape } from '@jsfkit/types';
import type { ManualLayout } from './ManualLayout.ts';
import type { Axis } from './axes/Axis.ts';
import type { Plot } from './plots/Plot.ts';
import type { DTable } from './DTable.ts';

export type PlotArea = {
  dTable?: DTable;
  layout?: ManualLayout;
  shape?: Shape;
  // at least one:
  plots: Plot[];
  // any number of:
  axes: Axis[];
};
