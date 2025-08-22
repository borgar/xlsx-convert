import { Document } from '@borgar/simple-xml';
import { numAttr } from '../utils/attr.js';

export function handlerSharedStrings (dom: Document): string[] {
  const sst = dom.querySelectorAll('sst')[0];

  const stringTable = sst.querySelectorAll('si').map(d => {
    return d.querySelectorAll('t').map(d => d.textContent).join('');
  });

  const count = numAttr(sst, 'uniqueCount', 0);
  if (count !== stringTable.length) {
    console.warn('String table did not contain correct amount of entries.');
    console.warn(`I got ${stringTable.length}, but expected ${count}`);
  }

  return stringTable;
}
