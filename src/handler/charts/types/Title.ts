import type { Shape } from '@jsfkit/types';
import type { ManualLayout } from './ManualLayout.ts';
import type { Text } from './Text.ts';
import type { TextProps } from './TextProps.ts';

export type Title = {
  text?: Text;
  textProps?: TextProps;
  layout?: ManualLayout;
  overlay?: boolean;
  shape?: Shape;
};
