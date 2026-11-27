import type { Shape } from '@jsfkit/types';
import type { Text } from './Text.ts';
import type { TextProps } from './TextProps.ts';
import type { PlotAreaEx } from './PlotAreaEx.ts';
import type { LegendEx } from './legend/LegendEx.ts';

export type TitleEx = {
  text?: Text;
  shape?: Shape;
  textProps?: TextProps;
  pos?: 't' | 'l' | 'b' | 'r';
  align?: 'min' | 'ctr' | 'max';
  overlay?: boolean;
};

export type ChartEx = {
  title?: TitleEx;
  plotArea?: PlotAreaEx;
  legend?: LegendEx;
};
