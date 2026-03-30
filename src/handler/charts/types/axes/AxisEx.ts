import type { Shape } from '@jsfkit/types';
import type { TextProps } from '../TextProps.ts';
import type { NumFmt } from '../NumFmt.ts';
import type { Text } from '../Text.ts';
import type { TickMark } from './TickMark.ts';
import type { BuiltInUnit } from './BuiltInUnit.ts';
import type { integer } from '../integer.ts';

export type AxisEx = {
  id: integer;
  // As catScaling & valScaling in the
  scaling: CategoryAxisScaling | ValueAxisScaling;
  /**
   * @default false
   */
  hidden: boolean;
  title?: AxisTitle;
  units?: AxisUnits;
  majorGridlines?: Shape; // CT_Gridlines = { shape?: Shape }
  minorGridlines?: Shape; // CT_Gridlines = { shape?: Shape }
  majorTickMarks?: TickMark;
  minorTickMarks?: TickMark;
  // tickLabels?: CT_TickLabels; // Empty type !?!
  numFmt?: NumFmt;
  shape?: Shape;
  textProps?: TextProps;
};

export type CategoryAxisScaling = {
  type: 'cat';
  /**
   * Min is exclusive :(
   * @min 0
   * @default "auto"
   */
  gapWidth?: 'auto' | number;
};

export type ValueAxisScaling = {
  max: 'auto' | number;
  min: 'auto' | number;
  /**
   * Min is exclusive :(
   * @min 0
   * @default "auto"
   */
  majorUnit: 'auto' | number;
  /**
   * Min is exclusive :(
   * @min 0
   * @default "auto"
   */
  minorUnit: 'auto' | number;
};

export type AxisTitle = {
  text?: Text;
  shape?: Shape;
  textProps?: TextProps;
  offset?: { top: number, left: number };
};

export type AxisUnits = {
  unitsLabel?: AxisUnitsLabel;
  unit?: BuiltInUnit | 'percentage';
};

export type AxisUnitsLabel = {
  text?: Text;
  shape?: Shape;
  textProps?: TextProps;
};
