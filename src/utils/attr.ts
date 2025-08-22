import type { Element } from '@borgar/simple-xml';

export function attr (node: Element, name: string, fallBack: string = null): string | null {
  if (node.hasAttribute(name)) {
    return node.getAttribute(name);
  }
  return fallBack;
}

export function numAttr (node: Element, name: string, fallBack: number = null): number | null {
  const v = attr(node, name);
  return v == null ? fallBack : +v;
}

export function boolAttr (node: Element, name: string, fallBack: any = null): boolean | null {
  const v = attr(node, name, fallBack);
  return v == null ? fallBack : !!+v;
}
