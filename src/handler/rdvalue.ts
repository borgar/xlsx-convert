import { Document } from '@borgar/simple-xml';
import { numAttr } from '../utils/attr.js';
import { ConversionContext } from '../ConversionContext.js';

export type RDValue = Record<string, string | number>;

export function handlerRDValue (dom: Document, context: ConversionContext): RDValue[] {
  const values = [];
  const structures = context.richStruct || [];

  dom.querySelectorAll('rvData > rv')
    .forEach(rv => {
      const nth = numAttr(rv, 's', 0);
      const s = structures[nth];
      const val: Record<string, string | number> = { _type: s.type };

      rv.getElementsByTagName('v')
        .forEach((k, i) => {
          const def = s.keys[i];
          let v: string | number = k.textContent;
          // FIXME: what other types exist? (a spec on it does not)
          if (def.type === 'i') {
            v = Math.floor(+v);
          }
          val[def.name] = v;
        });

      values.push(val);
    });

  return values;
}
