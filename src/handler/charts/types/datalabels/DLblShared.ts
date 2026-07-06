import type { Shape } from '@jsfkit/types';
import type { DLblPos } from './DLblPos.ts';
import type { NumFmt } from '../NumFmt.ts';
import type { TextProps } from '../TextProps.ts';

/**
 *
 */
export type DLblShared = {
  numFmt?: NumFmt;
  shape?: Shape;
  textProps?: TextProps;
  dLblPos?: DLblPos;
  showLegendKey?: boolean;
  showVal?: boolean;
  showCatName?: boolean;
  showSerName?: boolean;
  showPercent?: boolean;
  showBubbleSize?: boolean;
  separator?: string;
};
