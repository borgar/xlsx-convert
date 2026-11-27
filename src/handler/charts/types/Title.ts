import type { Shape } from '@jsfkit/types';
import type { ManualLayout } from './ManualLayout.ts';
import type { Text } from './Text.ts';
import type { TextProps } from './TextProps.ts';

export type Title = {
  text?: Text;
  textProps?: TextProps;
  layout?: ManualLayout;
  // set by the reader when absent: Excel treats a missing `c:overlay` as true
  overlay?: boolean;
  shape?: Shape;
};
