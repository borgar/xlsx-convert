import type { Document, Element } from '@borgar/simple-xml';
import type { ConversionContext } from '../ConversionContext.ts';
import { attr, numAttr } from '../utils/attr.ts';
import { MISSING_CELL_MDX } from '../constants.ts';

type MetaTableValue = Record<string, number | string>;

export type MetaData = {
  cells: MetaTableValue[];
  values: MetaTableValue[];
};

function parseBk (bk: Element, typeNames: string[], tables: Map<string, MetaTableValue[]>): MetaTableValue {
  const rc = bk.getElementsByTagName('rc')[0];
  const t = numAttr(rc, 't', 0);
  const v = numAttr(rc, 'v', 0);
  const typeName = typeNames[t - 1];
  const table = tables.get(typeName);
  if (typeName && !table) {
    return { _type: typeName };
  }
  if (!table?.[v]) {
    throw new Error(`Can't reach meta-value ${t}/${v} in metadata.xml`);
  }
  return table[v];
}

export function handlerMetaData (dom: Document, context: ConversionContext): MetaData {
  const typeNames = dom.getElementsByTagName('metadataType')
    .map(mdType => attr(mdType, 'name') ?? '');
  const tables = new Map<string, MetaTableValue[]>();

  if (dom.getElementsByTagName('mdxMetadata').length) {
    context.unsupported.add(MISSING_CELL_MDX);
  }

  dom.getElementsByTagName('futureMetadata')
    .forEach(fMD => {
      const table: MetaTableValue[] = [];
      const metaName = attr(fMD, 'name') ?? '';
      if (metaName !== 'XLDAPR' && metaName !== 'XLRICHVALUE') {
        return;
      }
      tables.set(metaName, table);
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
    .map(bk => parseBk(bk, typeNames, tables));

  // Value metadata is information about the value of a particular cell.
  // Value metadata properties can be propagated along with the value as
  // it is referenced in formulas.
  const values = dom.querySelectorAll('valueMetadata > bk')
    .map(bk => parseBk(bk, typeNames, tables));

  return {
    values: values,
    cells: cells,
  };
}
