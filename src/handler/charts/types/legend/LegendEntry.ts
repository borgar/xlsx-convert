import type { integer } from '../integer.ts';
import type { TextProps } from '../TextProps.ts';

export type LegendEntry =
  { idx: integer, delete: boolean } |
  { idx: integer, textProps?: TextProps };
