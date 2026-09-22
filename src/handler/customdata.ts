import type { Document } from '@borgar/simple-xml';
import type { ConversionContext } from '../ConversionContext.ts';

export function handlerCustomdata (dom: Document | null | undefined, context: ConversionContext): void {
  if (dom?.root) {
    for (const prop of dom.root.children) {
      if (prop.tagName === 'property') {
        context.unsupported.add('workbook-meta-custom');
        return;
      }
    }
  }
}
