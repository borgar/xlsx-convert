import type { Text } from '../Text.ts';
import type { ManualLayout } from '../ManualLayout.ts';
import type { DLblShared } from './DLblShared.ts';

/**
 *
 */
export type Group_DLbl = DLblShared & {
  layout?: ManualLayout;
  text?: Text;
};
