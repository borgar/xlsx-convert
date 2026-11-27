import type { integer, Shape } from '@jsfkit/types';
import type { TextProps } from '../TextProps.ts';
import type { NumFmt } from '../NumFmt.ts';
import type { Text } from '../Text.ts';
import type { TickMark } from './TickMark.ts';
import type { BuiltInUnit } from './BuiltInUnit.ts';

export type AxisEx = {
  id: integer;
  scaling: CategoryAxisScaling | ValueAxisScaling;
  hidden?: boolean;
  title?: AxisTitle;
  units?: AxisUnits;
  majorGridlines?: Shape;
  minorGridlines?: Shape;
  majorTickMarks?: TickMark;
  minorTickMarks?: TickMark;
  // `cx:tickLabels` is an empty element that turns tick labels on
  tickLabels?: boolean;
  numFmt?: NumFmt;
  shape?: Shape;
  textProps?: TextProps;
};

export type CategoryAxisScaling = {
  type: 'cat';
  gapWidth?: 'auto' | number;
};

export type ValueAxisScaling = {
  type: 'val';
  max?: 'auto' | number;
  min?: 'auto' | number;
  majorUnit?: 'auto' | number;
  minorUnit?: 'auto' | number;
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
