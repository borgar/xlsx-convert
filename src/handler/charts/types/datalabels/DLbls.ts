import type { ChartLines } from '../plots/ChartLines.ts';
import type { DLbl } from './DLbl.ts';
import type { DLblShared } from './DLblShared.ts';

export type DLbls = {
  dLbl?: DLbl[];
  // when set, every other property is ignored, apart from `dLbl`
  delete?: boolean;
  showLeaderLines?: boolean;
  leaderLines?: ChartLines;
} & DLblShared;
