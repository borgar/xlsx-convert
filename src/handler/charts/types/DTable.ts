import type { Shape } from '@jsfkit/types';
import type { TextProps } from './TextProps.ts';

export type DTable = {
  showHorzBorder?: boolean;
  showVertBorder?: boolean;
  showOutline?: boolean;
  showKeys?: boolean;
  shape?: Shape;
  textProps?: TextProps;
};
