import { Document } from '@borgar/simple-xml';
import type { ConversionContext } from '../ConversionContext.ts';
import { numAttr } from '../utils/attr.ts';

export function handlerSharedStrings (dom: Document, context: ConversionContext): string[] {
  const sst = dom.querySelectorAll('sst')[0];

  const stringTable = sst.querySelectorAll('si').map(d => {
    return d.querySelectorAll('t').map(d => d.textContent).join('');
  });

  const count = numAttr(sst, 'uniqueCount', 0);
  if (count !== stringTable.length) {
    context.warn(`String table: got ${stringTable.length} entries, but expected ${count}`);
  }

  return stringTable;
}
