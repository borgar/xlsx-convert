import type { integer } from '@jsfkit/types';
import type { ManualLayout } from '../ManualLayout.ts';
import type { DLblShared } from './DLblShared.ts';
import type { Text } from '../Text.ts';

/**
 *
 */
export type DLbl = {
  idx: integer;
  /** when `delete` is set, ignore all other props except idx */
  delete?: boolean;
  layout?: ManualLayout;
  text?: Text;
} & DLblShared;
