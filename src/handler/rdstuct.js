import { attr } from '../utils/attr.js';

/**
 * @typedef RDStructKey
 * @prop {string} name
 * @prop {string} type
 */

/**
 * @typedef RDStruct
 * @prop {string} type
 * @prop {RDStructKey[]} keys
 */

/**
 * @param {import('@borgar/simple-xml').Document} dom
 * @returns {RDStruct[]}
 */
export function handlerRDStruct (dom) {
  const structures = [];

  dom.querySelectorAll('rvStructures > s')
    .forEach(s => {
      structures.push({
        type: attr(s, 't'),
        keys: s.getElementsByTagName('k').map(k => ({
          name: attr(k, 'n'),
          type: attr(k, 't')
        }))
      });
    });

  return structures;
}
