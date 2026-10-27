import type { Element } from '@borgar/simple-xml';
import { unescape } from './unescape.ts';

export function attr<T = string | null> (
  node: Element,
  name: string,
  fallBack: T = null as unknown as T,
): string | T {
  if (node.hasAttribute(name)) {
    return node.getAttribute(name)!;
  }
  return fallBack;
}

/**
 * Read an attribute of the ST_Xstring type, decoding its `_xHHHH_` escapes.
 */
export function xstringAttr<T = string | null> (
  node: Element,
  name: string,
  fallBack: T = null as unknown as T,
): string | T {
  const v = attr(node, name);
  return v == null ? fallBack : unescape(v);
}

export function numAttr<T = number | null> (
  node: Element,
  name: string,
  fallBack: T = null as unknown as T,
): number | T {
  const v = attr(node, name);
  return v != null && Number.isFinite(+v) ? +v : fallBack;
}

export function boolAttr<T = boolean | null> (
  node: Element,
  name: string,
  fallBack: T = null as unknown as T,
): boolean | T {
  const v = attr(node, name, fallBack);
  return v == null ? fallBack : v === 'true' || !!+v;
}

export function dmlPercentAttr<T = number | null> (
  node: Element,
  name: string,
  fallBack: T = null as unknown as T,
): number | T {
  const v = attr(node, name);
  return v == null ? fallBack : +v * 0.001;
}

export function numStrAttr<T = number | null> (
  node: Element,
  name: string,
  fallBack: T = null as unknown as T,
): number | string | T {
  const v = attr(node, name);
  if (v == null) { return fallBack; }
  if (isFinite(+v)) { return +v; }
  return v;
}
