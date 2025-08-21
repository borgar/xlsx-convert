import { attr, numAttr } from '../utils/attr.js';
import { handlerCell } from './cell.js';
import { normalizeFormula } from '../utils/normalizeFormula.js';
import { ConversionContext } from '../ConversionContext.js';

/**
 * @param {import('@borgar/simple-xml').Document} dom
 * @param {string} [fileName]
 * @returns {import('../jsf-types.js').JSFExternal}
 */
export function handlerExternal (dom, fileName = '') {
  const external = {
    filename: fileName,
    sheets: [],
    names: []
  };

  // read sheet names
  dom.querySelectorAll('sheetNames > sheetName')
    .forEach(sheetName => {
      external.sheets.push({
        name: attr(sheetName, 'val'),
        cells: {}
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
        value: normalizeFormula(attr(definedName, 'refersTo'))
      });
    });

  return external;
}
