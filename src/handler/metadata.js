import { attr, numAttr } from '../utils/attr.js';

/**
 * @typedef {Record<string, number | string>} MetaTableValue
 */

/**
 * @typedef MetaTable
 * @prop {string} name
 * @prop {MetaTableValue[]} values
 */

/**
 * @typedef MetaData
 * @prop {MetaTableValue[]} values
 * @prop {MetaTableValue[]} cells
 */

/**
 * @param {import('@borgar/simple-xml').Element} bk
 * @param {MetaTable[]} tables
 * @return {MetaTableValue}
 */
function parseBk (bk, tables) {
  const rc = bk.getElementsByTagName('rc')[0];
  const t = numAttr(rc, 't', 0);
  const v = numAttr(rc, 'v', 0);
  const r = tables[t - 1];
  if (!r || !r.values[v]) {
    throw new Error(`Can't reach meta-value ${t}/${v} in metadata.xml`);
  }
  return r.values[v];
}

/**
 * @param {import('@borgar/simple-xml').Document} dom
 * @param {import('../ConversionContext.js').ConversionContext} context
 * @return {MetaData}
 */
export function handlerMetaData (dom, context) {
  /** @type {MetaTable[]} */
  const tables = [];

  dom.getElementsByTagName('futureMetadata')
    .forEach(fMD => {
      /** @type {MetaTableValue[]} */
      const table = [];
      const metaName = attr(fMD, 'name');
      tables.push({ name: metaName, values: table });
      fMD.querySelectorAll('bk ext')
        .forEach(ext => {
          if (metaName === 'XLDAPR') {
            const dAP = ext.getElementsByTagName('dynamicArrayProperties')[0];
            table.push({
              _type: '_dynamicArray',
              fCollapsed: numAttr(dAP, 'fCollapsed'),
              fDynamic: numAttr(dAP, 'fDynamic')
            });
          }
          else if (metaName === 'XLRICHVALUE') {
            const rvb = ext.getElementsByTagName('rvb')[0];
            table.push(context.richValues[numAttr(rvb, 'i', 0)]);
          }
        });
    });

  // Cell metadata contains information about the cell itself.
  const cells = dom.querySelectorAll('cellMetadata > bk')
    .map(bk => parseBk(bk, tables));

  // Value metadata is information about the value of a particular cell.
  // Value metadata properties can be propagated along with the value as
  // it is referenced in formulas.
  const values = dom.querySelectorAll('valueMetadata > bk')
    .map(bk => parseBk(bk, tables));

  return {
    values: values,
    cells: cells
  };
}
