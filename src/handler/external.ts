import { Element, type Document } from '@borgar/simple-xml';
import { attr, boolAttr, numAttr } from '../utils/attr.ts';
import { handlerCell } from './cell.ts';
import { normalizeFormula } from '../utils/normalizeFormula.ts';
import { ConversionContext } from '../ConversionContext.ts';
import type { External, DefinedName } from '@jsfkit/types';

const NO_EXTERNALS = { externalLinks: [] };

export function handlerExternal (dom: Document, fileName: string = ''): External {
  const external: External = {
    name: fileName,
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
      if (boolAttr(sheetData, 'refreshError')) {
        external.sheets[sheetIndex].refreshError = true;
      }
      const externalCells = external.sheets[sheetIndex].cells;
      for (const row of sheetData.childNodes) {
        if (row instanceof Element && row.tagName === 'row') {
          for (const cell of row.childNodes) {
            if (cell instanceof Element && cell.tagName === 'cell') {
              const c = handlerCell(cell, dummyContext);
              if (c) {
                externalCells[attr(cell, 'r')] = c;
              }
            }
          }
        }
      }
    });

  // read defined names
  dom.querySelectorAll('definedNames > definedName')
    .forEach(definedName => {
      const nameDef: DefinedName = {
        name: attr(definedName, 'name'),
      };
      const expr = attr(definedName, 'refersTo');
      if (expr) {
        nameDef.value = normalizeFormula(expr, NO_EXTERNALS);
      }
      external.names.push(nameDef);
    });

  return external;
}
