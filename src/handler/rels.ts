import { Document } from '@borgar/simple-xml';
import { attr } from '../utils/attr.ts';
import { REL_PREFIXES } from '../constants.ts';
import { pathDirname, pathJoin } from '../utils/path.ts';

export type Rel = {
  id: string;
  type: string;
  target: string;
};

export function handlerRels (dom: Document, basepath = 'xl/workbook.xml'): Rel[] {
  basepath = pathDirname(basepath);
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
              target = pathJoin(basepath, target);
            }
            break;
          }
        }
        rels.push({
          id: attr(d, 'Id'),
          type: type,
          target: target,
        });
      });
  }
  return rels;
}
