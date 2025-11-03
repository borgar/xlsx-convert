import type { Document, Element } from '@borgar/simple-xml';

export function getFirstChild (parent: Element | Document | null | undefined, tagName: string): Element | undefined {
  if (parent) {
    for (const child of parent.children) {
      if (child.tagName === tagName) {
        return child;
      }
    }
  }
}
