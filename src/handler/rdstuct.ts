import { Document } from '@borgar/simple-xml';
import { attr } from '../utils/attr.js';

export type RDStructKey = {
  name: string;
  type: string;
};

export type RDStruct = {
  type: string;
  keys: RDStructKey[];
};

export function handlerRDStruct (dom: Document): RDStruct[] {
  const structures = [];

  dom.querySelectorAll('rvStructures > s')
    .forEach(s => {
      structures.push({
        type: attr(s, 't'),
        keys: s.getElementsByTagName('k').map(k => ({
          name: attr(k, 'n'),
          type: attr(k, 't'),
        })),
      });
    });

  return structures;
}
