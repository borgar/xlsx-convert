import type { Element } from '@borgar/simple-xml';

export function attr<T = string | null> (
  node: Element,
  name: string,
  fallBack: T = null as unknown as T,
): string | T {
  if (node.hasAttribute(name)) {
    return node.getAttribute(name);
  }
  return fallBack;
}

export function numAttr<T = number | null> (
  node: Element,
  name: string,
  fallBack: T = null as unknown as T,
): number | T {
  const v = attr(node, name);
  return v == null ? fallBack : +v;
}

export function boolAttr<T = boolean | null> (
  node: Element,
  name: string,
  fallBack: T = null as unknown as T,
): boolean | T {
  const v = attr(node, name, fallBack);
  return v == null ? fallBack : !!+v;
}
