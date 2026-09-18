import type { Element } from '@borgar/simple-xml';
import type { Percentage } from '@jsfkit/types';

export function boolValElm (elm: Element, fallback = false): boolean {
  const v = elm?.getAttribute('val');
  if (v != null) {
    return v === '1' || v === 'true';
  }
  return fallback;
}

export function strValElm<T = string> (elm: Element, fallback: T | null = null): T | null {
  return (elm?.getAttribute('val') as T) ?? fallback;
}

export function numValElm (elm: Element, fallback: number | null = null): number | null {
  const s = elm?.getAttribute('val');
  if (s != null && isFinite(+s)) {
    return +s;
  }
  return fallback;
}

/**
 * Read either a percent string ("100%") or a number.
 * Ensure that it is within bounds or reject it in favor of `fallback`.
 */
export function xperValElm (
  elm: Element,
  min = 0,
  max = Infinity,
  fallback: Percentage | null = null,
): Percentage | null {
  let s = elm?.getAttribute('val');
  if (s != null) {
    if (/^\d+%$/.test(s)) {
      s = s.slice(0, -1);
    }
    const v = +s;
    if (isFinite(v) && v >= min && v <= max) {
      return v;
    }
  }
  return fallback;
}
