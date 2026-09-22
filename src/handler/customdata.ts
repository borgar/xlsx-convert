import type { Document } from '@borgar/simple-xml';
import type { ConversionContext } from '../ConversionContext.ts';
import { MISSING_WORKBOOK_META_CUSTOM } from '../constants.ts';

export function handlerCustomdata (dom: Document | null | undefined, context: ConversionContext): void {
  if (dom?.root) {
    for (const prop of dom.root.children) {
      if (prop.tagName === 'property') {
        context.unsupported.add(MISSING_WORKBOOK_META_CUSTOM);
        return;
      }
    }
  }
}
