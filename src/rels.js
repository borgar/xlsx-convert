import path from 'path';
import attr from './utils/attr.js';
import { REL_PREFIXES } from './constants.js';

export default function (dom, basepath = 'xl/workbook.xml') {
  basepath = path.dirname(basepath);
  const rels = [];
  if (dom) {
    dom
      .querySelectorAll('Relationship')
      .forEach(d => {
        let type = attr(d, 'Type');
        REL_PREFIXES.forEach(p => {
          if (type.startsWith(p)) {
            type = type.slice(p.length);
          }
        });
        rels.push({
          id: attr(d, 'Id'),
          type: type,
          target: path.join(basepath, attr(d, 'Target'))
        });
      });
  }
  return rels;
}
