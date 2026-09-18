import type { Shape } from '@jsfkit/types';
import type { TextProps } from '../TextProps.ts';

export type LegendEx = {
  shape?: Shape;
  textProps?: TextProps;
  offset?: { top: number, left: number };
  /**
   * @default "r"
   */
  // LegendPos?
  pos: 't' | 'l' | 'b' | 'r'; // XXX: Excel UI allows setting "top right" !?!
  /**
   * @default "ctr"
   */
  align: 'min' | 'ctr' | 'max';
  /**
   * @default false
   */
  overlay?: boolean;
};
