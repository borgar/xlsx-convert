import { Document } from '@borgar/simple-xml';
import type { ConversionContext } from '../ConversionContext.ts';
import { numAttr } from '../utils/attr.ts';
import { RichText } from '../utils/RichText.ts';
import { MISSING_CELL_RTF } from '../constants.ts';

export function handlerSharedStrings (dom: Document, context: ConversionContext): string[] {
  const stringTable = [];
  let rtf = false;

  if (dom.root?.tagName === 'sst') {
    const table = dom.root?.children ?? [];
    for (const row of table) {
      const rt = RichText.from(row);
      if (rt.isRich) {
        rtf = true;
      }
      stringTable.push(rt.text);
    }

    const count = numAttr(dom.root, 'uniqueCount', 0);
    if (count !== stringTable.length) {
      context.warn(`String table: got ${stringTable.length} entries, but expected ${count}`);
    }
  }
  else {
    context.warn('String table: table is missing');
  }

  if (rtf) {
    context.unsupported.add(MISSING_CELL_RTF);
  }

  return stringTable;
}
