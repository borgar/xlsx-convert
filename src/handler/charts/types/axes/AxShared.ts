import type { Shape } from '@jsfkit/types';
import type { AxPos } from './AxPos.ts';
import type { Scaling } from './Scaling.ts';
import type { Title } from '../Title.ts';
import type { NumFmt } from '../NumFmt.ts';
import type { TickMark } from './TickMark.ts';
import type { TickLblPos } from './TickLblPos.ts';
import type { Crosses } from './Crosses.ts';
import type { TextProps } from '../TextProps.ts';

type integer = number;

export type AxShared = {
  axId: integer; // string?
  scaling?: Scaling;
  delete?: boolean;
  axPos: AxPos;
  majorGridlines?: Shape;
  minorGridlines?: Shape;
  title?: Title;
  numFmt?: NumFmt;
  majorTickMark?: TickMark; /* default: "cross" if set */
  minorTickMark?: TickMark; /* default: "cross" if set */
  tickLblPos?: TickLblPos; /* default: "nextTo" if set */
  shape?: Shape;
  textProps?: TextProps;

  // This element specifies the ID of axis that this axis crosses.
  // For instance, a category axis might cross a value axis, and the
  // category axis'scrossAx would contain the ID of the value axis.
  crossAx: integer;

  // --- oneOf:
  crosses: Crosses | number;
  // crossesAt: number;
  // --- /oneOf
};
