import type { Shape } from '@jsfkit/types';
import type { ManualLayout } from '../ManualLayout.ts';
import type { LegendEntry } from './LegendEntry.ts';
import type { LegendPos } from './LegendPos.ts';
import type { TextProps } from '../TextProps.ts';

export type Legend = {
  /**
   * Ex charts will not include a 'tr' position
   * @default "r"
   */
  pos?: LegendPos; // default when read: "r"
  /**
   * Formatting for
   */
  legendEntry?: LegendEntry[];
  layout?: ManualLayout;
  /**
   * A true means that the legend may overlap the chart
   * @default false
   */
  overlay?: boolean;
  shape?: Shape;
  textProps?: TextProps;
};
