import type { Shape } from '@jsfkit/types';
import type { ManualLayout } from '../ManualLayout.ts';
import type { LegendEntry } from './LegendEntry.ts';
import type { LegendPos } from './LegendPos.ts';
import type { TextProps } from '../TextProps.ts';

export type Legend = {
  legendPos?: LegendPos; // default when read: "r"
  legendEntry?: LegendEntry[];
  layout?: ManualLayout;
  overlay?: boolean;
  shape?: Shape;
  textProps?: TextProps;
};
