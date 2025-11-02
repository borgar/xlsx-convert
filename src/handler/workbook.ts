import { Document } from '@borgar/simple-xml';
import { ConversionContext } from '../ConversionContext.ts';
import { attr, boolAttr, numAttr } from '../utils/attr.ts';
import { normalizeFormula } from '../utils/normalizeFormula.ts';
import { toInt } from '../utils/typecast.ts';
import type { DefinedName, Workbook } from '@jsfkit/types';

export function handlerWorkbook (dom: Document, context: ConversionContext): Workbook {
  const wb: Workbook = {
    name: context.filename,
    sheets: [],
    names: [],
    // charts: [],
    calculationProperties: {
      iterate: false,
      iterateCount: 100,
      iterateDelta: 0.001,
      epoch: 1900,
    },
    styles: [],
    tables: [],
    // externals: [],
  };

  dom.querySelectorAll('sheets > sheet')
    .forEach(d => {
      context.sheetLinks.push({
        name: attr(d, 'name'),
        index: numAttr(d, 'sheetId'),
        rId: attr(d, 'r:id'),
      });
    });

  // FIXME: discard names that appear twice
  dom.getElementsByTagName('definedName')
    .forEach(d => {
      const name: DefinedName = {
        name: attr(d, 'name'),
        value: normalizeFormula(d.textContent, context),
      };
      const hidden = boolAttr(d, 'hidden');
      if (hidden) {
        return;
      }
      const localSheetId = attr(d, 'localSheetId');
      if (localSheetId) {
        name.scope = context.sheetLinks[+localSheetId].name;
      }
      wb.names.push(name);
    });

  const pr = dom.querySelectorAll('workbook > workbookPr')[0];
  wb.calculationProperties.epoch = (pr && numAttr(pr, 'date1904')) ? 1904 : 1900;

  const calcPr = dom.getElementsByTagName('calcPr')[0];
  if (calcPr) {
    const iterate = toInt(attr(calcPr, 'iterate'));
    if (iterate && isFinite(iterate)) {
      wb.calculationProperties = {
        iterate: true,
        iterateCount: toInt(numAttr(calcPr, 'iterateCount', 100)),
        iterateDelta: numAttr(calcPr, 'iterateDelta', 0.001),
        epoch: wb.calculationProperties.epoch,
      };
    }
  }

  return wb;
}
