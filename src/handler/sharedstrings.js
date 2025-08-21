import { numAttr } from '../utils/attr.js';

/**
 * @param {import('@borgar/simple-xml').Document} dom
 * @returns {string[]}
 */
export function handlerSharedStrings (dom) {
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
