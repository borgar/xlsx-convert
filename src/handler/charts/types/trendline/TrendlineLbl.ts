import type { Shape } from '@jsfkit/types';
import type { ManualLayout } from '../ManualLayout.ts';
import type { Text } from '../Text.ts';
import type { NumFmt } from '../NumFmt.ts';
import type { TextProps } from '../TextProps.ts';

/**
 *
 */
export type TrendlineLbl = {
  layout?: ManualLayout;
  numFmt?: NumFmt;
  shape?: Shape;
  text?: Text;
  textProps?: TextProps;
};
