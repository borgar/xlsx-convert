import type { Document, Element } from '@borgar/simple-xml';
import type { ConversionContext } from '../ConversionContext.ts';
import { attr, numAttr } from '../utils/attr.ts';

type MetaTableValue = Record<string, number | string>;

type MetaTable = {
  name: string;
  values: MetaTableValue[];
};

export type MetaData = {
  cells: MetaTableValue[];
  values: MetaTableValue[];
};

function parseBk (bk: Element, tables: MetaTable[]): MetaTableValue {
  const rc = bk.getElementsByTagName('rc')[0];
  const t = numAttr(rc, 't', 0);
  const v = numAttr(rc, 'v', 0);
  const r = tables[t - 1];
  if (!r?.values[v]) {
    throw new Error(`Can't reach meta-value ${t}/${v} in metadata.xml`);
  }
  return r.values[v];
}

export function handlerMetaData (dom: Document, context: ConversionContext): MetaData {
  const tables: MetaTable[] = [];

  dom.getElementsByTagName('futureMetadata')
    .forEach(fMD => {
      const table: MetaTableValue[] = [];
      const metaName = attr(fMD, 'name');
      tables.push({ name: metaName, values: table });
      fMD.querySelectorAll('bk ext')
        .forEach(ext => {
          if (metaName === 'XLDAPR') {
            const dAP = ext.getElementsByTagName('dynamicArrayProperties')[0];
            table.push({
              _type: '_dynamicArray',
              fCollapsed: numAttr(dAP, 'fCollapsed'),
              fDynamic: numAttr(dAP, 'fDynamic'),
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
    cells: cells,
  };
}
