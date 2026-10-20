import type { integer } from '@jsfkit/types';
import type { ManualLayout } from '../ManualLayout.ts';
import type { DLblShared } from './DLblShared.ts';
import type { Text } from '../Text.ts';

export type DLbl = {
  idx: integer;
  // when set, every other property is ignored, apart from `idx`
  delete?: boolean;
  layout?: ManualLayout;
  text?: Text;
} & DLblShared;
