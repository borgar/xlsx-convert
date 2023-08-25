import attr from './utils/attr.js';
import handlerCell from './cell.js';
import { normalizeFormula } from './utils/normalizeFormula.js';

export default function (dom, fileName = '') {
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
  const dummyWb = { options: {}, styles: [] };
  dom.querySelectorAll('sheetDataSet > sheetData')
    .forEach(sheetData => {
      const sheetIndex = +attr(sheetData, 'sheetId', 0);
      const externalCells = external.sheets[sheetIndex].cells;
      sheetData.querySelectorAll('row > cell')
        .forEach(cell => {
          const id = attr(cell, 'r');
          const c = handlerCell(cell, dummyWb);
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
