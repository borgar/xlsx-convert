import type { integer } from '../integer.ts';
import type { TextProps } from '../TextProps.ts';

export type LegendEntry = {
  /**
   * The index of the legend entry this applies to.
   */
  idx: integer,
  /**
   * Has is the legend entry to be omitted from the chart?
   */
  delete?: boolean,
  /**
   * Font style properties for the legend entry.
   */
  textProps?: TextProps
};
