import type { Document } from '@borgar/simple-xml';
import { attr, numAttr } from '../utils/attr.ts';
import { handlerCell } from './cell.ts';
import { normalizeFormula } from '../utils/normalizeFormula.ts';
import { ConversionContext } from '../ConversionContext.ts';
import type { JSFExternal } from '../jsf-types.js';

export function handlerExternal (dom: Document, fileName:string = ''): JSFExternal {
  const external: JSFExternal = {
    filename: fileName,
    sheets: [],
    names: [],
  };

  // read sheet names
  dom.querySelectorAll('sheetNames > sheetName')
    .forEach(sheetName => {
      external.sheets.push({
        name: attr(sheetName, 'val'),
        cells: {},
      });
    });

  // read cells and their values
  const dummyContext = new ConversionContext();
  dom.querySelectorAll('sheetDataSet > sheetData')
    .forEach(sheetData => {
      const sheetIndex = numAttr(sheetData, 'sheetId', 0);
      const externalCells = external.sheets[sheetIndex].cells;
      sheetData.querySelectorAll('row > cell')
        .forEach(cell => {
          const id = attr(cell, 'r');
          const c = handlerCell(cell, dummyContext);
          if (c) {
            externalCells[id] = c;
          }
        });
    });

  // read defined names
  dom.querySelectorAll('definedNames > definedName')
    .forEach(definedName => {
      external.names.push({
        name: attr(definedName, 'name'),
        value: normalizeFormula(attr(definedName, 'refersTo'), {}),
      });
    });

  return external;
}
