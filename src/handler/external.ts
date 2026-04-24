import { Element, type Document } from '@borgar/simple-xml';
import { attr, boolAttr, numAttr } from '../utils/attr.ts';
import { handlerCell } from './cell.ts';
import { normalizeFormula } from '../utils/normalizeFormula.ts';
import { ConversionContext } from '../ConversionContext.ts';
import type { External, ExternalDefinedName } from '@jsfkit/types';

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
  //
  // A sheet named in `<sheetNames>` but missing from `<sheetDataSet>` is distinct
  // from one with an empty `<sheetData sheetId="N"/>`; track which sheetIds
  // actually had a `<sheetData>` element so the emitter can tell them apart
  // when round-tripping.
  const sheetDataSeen = new Set<number>();
  const dummyContext = new ConversionContext();
  dom.querySelectorAll('sheetDataSet > sheetData')
    .forEach(sheetData => {
      const sheetIndex = numAttr(sheetData, 'sheetId', 0);
      sheetDataSeen.add(sheetIndex);
      if (boolAttr(sheetData, 'refreshError')) {
        external.sheets[sheetIndex].refreshError = true;
      }
      const externalCells = external.sheets[sheetIndex].cells;
      for (const row of sheetData.childNodes) {
        if (row instanceof Element && row.tagName === 'row') {
          for (const cell of row.childNodes) {
            if (cell instanceof Element && cell.tagName === 'cell') {
              // External sheetData carries the cached values the host workbook
              // consumed; an empty `<cell r="X"/>` still signals "this cell was
              // in the captured range" and we preserve it as an empty object
              // rather than dropping it the way `handlerCell` does for host
              // worksheet cells.
              externalCells[attr(cell, 'r')] = handlerCell(cell, dummyContext) ?? {};
            }
          }
        }
      }
    });
  external.sheets.forEach((sheet, idx) => {
    if (!sheetDataSeen.has(idx)) {
      sheet.noSheetData = true;
    }
  });

  // read defined names
  dom.querySelectorAll('definedNames > definedName')
    .forEach(definedName => {
      const nameDef: ExternalDefinedName = {
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
