import { numAttr } from '../utils/attr.js';

/**
 * @typedef {Record<string, string | number>} RDValue
 */

/**
 * @param {import('@borgar/simple-xml').Document} dom
 * @param {import('../ConversionContext.js').ConversionContext} context
 * @returns {RDValue[]}
 */
export function handlerRDValue (dom, context) {
  const values = [];
  const structures = context.richStruct || [];

  dom.querySelectorAll('rvData > rv')
    .forEach(rv => {
      const nth = numAttr(rv, 's', 0);
      const s = structures[nth];
      /** @type {Record<string, string | number>} */
      const val = { _type: s.type };

      rv.getElementsByTagName('v')
        .forEach((k, i) => {
          const def = s.keys[i];
          /** @type {string | number} */
          let v = k.textContent;
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
