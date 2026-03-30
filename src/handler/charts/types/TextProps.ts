import type { DmlAngle, TextAnchoring, TextVerticalType } from '@jsfkit/types';

// This is a subset of TextBody properties

export type TextProps = {
  /**
   * Vertical anchoring/alignment of text within the shape.
   * @default "t"
   */
  anchor?: TextAnchoring,

  /**
   * Whether text is centered at the anchor point.
   * @default false
   */
  anchorCtr?: boolean,

  /**
   * Text rotation in 60,000ths of a degree (e.g., 5400000 = 90 degrees).
   * @default 0
   */
  rot?: DmlAngle,

  /**
   * Keep text upright regardless of shape rotation.
   * @default false
   */
  upright?: boolean,

  /**
   * Text orientation is vertical (top-to-bottom).
   * @default "horz"
   */
  vert?: TextVerticalType,
};
