import type { Color, DmlAngle, TextAnchoring, TextVerticalType, Underline } from '@jsfkit/types';

export type TextProps = {
  anchor?: TextAnchoring,
  // in 60,000ths of a degree
  rot?: DmlAngle,
  vert?: TextVerticalType,
  color?: Color,
  typeface?: string,
  size?: number,
  bold?: boolean,
  italic?: boolean,
  underline?: Underline,
  caps?: 'all' | 'none',
};
