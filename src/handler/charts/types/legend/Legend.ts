import type { Shape } from '@jsfkit/types';
import type { ManualLayout } from '../ManualLayout.ts';
import type { LegendEntry } from './LegendEntry.ts';
import type { LegendPos } from './LegendPos.ts';
import type { TextProps } from '../TextProps.ts';

export type Legend = {
  pos?: LegendPos;
  legendEntry?: LegendEntry[];
  layout?: ManualLayout;
  // set by the reader when absent: Excel treats a missing `c:overlay` as true
  overlay?: boolean;
  shape?: Shape;
  textProps?: TextProps;
};
