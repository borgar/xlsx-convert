import type { DLblShared } from './DLblShared.ts';
import type { ChartLines } from '../plots/ChartLines.ts';

/**
 *
 */
export type Group_DLbls = DLblShared & {
  showLeaderLines?: boolean;
  leaderLines?: ChartLines;
};
