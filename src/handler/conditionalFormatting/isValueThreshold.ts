import type { CFDataBarThreshold, CFValueThreshold } from '@jsfkit/types';

/**
 * Narrows a threshold to one with an explicit value (`number`, `percent`, `percentile`, or
 * `formula`), as opposed to `min`, `max`, `autoMin`, or `autoMax`.
 */
export function isValueThreshold (t: CFDataBarThreshold): t is CFValueThreshold {
  return 'value' in t;
}
