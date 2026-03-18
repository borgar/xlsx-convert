import type { Element } from '@borgar/simple-xml';
import { boolAttr } from '../../utils/attr.ts';

/** Set boolean properties on target when the XML attribute has the given non-default value. */
export function readBoolAttrs<T extends Record<string, unknown>> (
  target: T, elm: Element, specs: readonly [keyof T & string, boolean][],
): void {
  for (const [ prop, nonDefault ] of specs) {
    if (boolAttr(elm, prop) === nonDefault) {
      (target as Record<string, unknown>)[prop] = nonDefault;
    }
  }
}
