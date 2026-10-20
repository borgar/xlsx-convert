import type { integer, Shape } from '@jsfkit/types';
import type { AxPos } from './AxPos.ts';
import type { Scaling } from './Scaling.ts';
import type { Title } from '../Title.ts';
import type { NumFmt } from '../NumFmt.ts';
import type { TickMark } from './TickMark.ts';
import type { TickLblPos } from './TickLblPos.ts';
import type { Crosses } from './Crosses.ts';
import type { TextProps } from '../TextProps.ts';

export type AxShared = {
  axId: integer;
  scaling?: Scaling;
  delete?: boolean;
  axPos: AxPos;
  majorGridlines?: Shape;
  minorGridlines?: Shape;
  title?: Title;
  numFmt?: NumFmt;
  majorTickMark?: TickMark;
  minorTickMark?: TickMark;
  tickLblPos?: TickLblPos;
  shape?: Shape;
  textProps?: TextProps;
  crossAx: integer;
  crosses: Crosses | number;
};
