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
        const mode = attr(d, 'TargetMode');
        let type = attr(d, 'Type');
        let target = attr(d, 'Target');
        for (const p of REL_PREFIXES) {
          if (type.startsWith(p)) {
            type = type.slice(p.length);
            if (mode !== 'External') {
              target = path.join(basepath, target);
            }
            break;
          }
        }
        rels.push({
          id: attr(d, 'Id'),
          type: type,
          target: target
        });
      });
  }
  return rels;
}
