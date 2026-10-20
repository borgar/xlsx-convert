import type { Shape } from '@jsfkit/types';
import type { TextProps } from '../TextProps.ts';

export type LegendEx = {
  shape?: Shape;
  textProps?: TextProps;
  offset?: { top: number, left: number };
  pos?: 't' | 'l' | 'b' | 'r';
  align?: 'min' | 'ctr' | 'max';
  overlay?: boolean;
};
