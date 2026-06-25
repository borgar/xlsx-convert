import type { NumDataSource } from '../types/data/NumDataSource.ts';

export function isNumDataSource (item: unknown): item is NumDataSource {
  return (
    !!item &&
    typeof item === 'object' &&
    'type' in item &&
    (item.type === 'numRef' || item.type === 'numData')
  );
}
