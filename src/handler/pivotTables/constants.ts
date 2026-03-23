import type { PivotItemType, PivotSubtotalFunction } from '@jsfkit/types';

export const SUBTOTAL_FUNCTIONS: PivotSubtotalFunction[] = [
  'sum',
  'countA',
  'avg',
  'max',
  'min',
  'product',
  'count',
  'stdDev',
  'stdDevP',
  'var',
  'varP',
];

export const ITEM_TYPES: ReadonlySet<PivotItemType> = new Set<PivotItemType>([
  ...SUBTOTAL_FUNCTIONS, 'data', 'default', 'grand', 'blank',
]);
