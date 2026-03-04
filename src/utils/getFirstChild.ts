import type { Document, Element } from '@borgar/simple-xml';

export function getFirstChild (
  parent: Element | Document | null | undefined,
  tagName?: string | string[],
): Element | undefined {
  if (parent) {
    if (typeof tagName === 'string' || !tagName) {
      for (const child of parent.children) {
        if (child.tagName === tagName || tagName === '*' || !tagName) {
          return child;
        }
      }
    }
    else if (Array.isArray(tagName)) {
      for (const child of parent.children) {
        if (tagName.includes(child.tagName)) {
          return child;
        }
      }
    }
  }
}
