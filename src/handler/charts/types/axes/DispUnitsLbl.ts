import type { Shape } from '@jsfkit/types';
import type { ManualLayout } from '../ManualLayout.ts';
import type { Text } from '../Text.ts';
import type { TextProps } from '../TextProps.ts';

export type DispUnitsLbl = {
  layout?: ManualLayout;
  text?: Text;
  shape?: Shape;
  textProps?: TextProps;
};
