import attr from './utils/attr.js';
import { toCol, toRect, renderA1 } from './utils/A1.js';
import handlerCell from './cell.js';
import conditionalFormatting from './conditionalFormatting.js';

export default function (dom, wb) {
  const sheet = {
    name: '',
    cells: {},
    col_widths: {},
    merged_cells: [],
    row_heights: {},
    dynamic_formatting: [],
    hidden: false
  };

  // decode column widths
  dom.getElementsByTagName('col').forEach(d => {
    const min = +attr(d, 'min', 0);
    const max = +attr(d, 'max', 100000); // FIXME: What is the actual max value?
    const hidden = +attr(d, 'hidden', 0);
    const width = hidden ? 0 : +attr(d, 'width');
    for (let i = min; i <= max; i++) {
      sheet.col_widths[toCol(i - 1)] = width;
    }
  });

  // read conditional formats
  sheet.dynamic_formatting = conditionalFormatting(dom, wb);

  wb._shared = {};
  wb._arrayFormula = [];
  wb._merged = {};
  wb.currentSheet = sheet;

  // list merged cells
  dom.getElementsByTagName('mergeCell')
    .forEach(d => {
      const ref = attr(d, 'ref');
      const rect = toRect(ref);
      const [ minC, minR ] = rect[0];
      const [ maxC, maxR ] = rect[1];
      const anchor = renderA1(rect[0]);
      for (let c = minC; c <= maxC; c++) {
        for (let r = minR; r <= maxR; r++) {
          wb._merged[renderA1([ c, r ])] = anchor;
        }
      }
      sheet.merged_cells.push(ref);
    });

  // parse cells
  dom.querySelectorAll('row')
    .forEach(row => {
      // .r = Row index. Indicates to which row in the sheet this <row> definition corresponds.
      const r = attr(row, 'r');

      // .hidden = 1 if the row is hidden (.collapsed also exists)
      // .ht = Row height measured in point size
      const isHidden = +attr(row, 'hidden');
      if (isHidden) {
        sheet.row_heights[r] = 0;
      }
      else {
        const ht = attr(row, 'ht');
        if (ht != null) {
          sheet.row_heights[r] = +ht;
        }
      }

      // FIXME: rows have styles:
      // .customFormat = 1 if the row style should be applied.
      // .s = Style Index. Index to style record for the row (only applied if customFormat attribute is '1').

      // cells
      row.querySelectorAll('> c').forEach(d => {
        const id = attr(d, 'r');
        if (wb.options.skip_merged) {
          if (wb._merged[id] && wb._merged[id] !== id) {
            // this cell is part of a merged range
            return;
          }
        }
        const c = handlerCell(d, wb);
        if (c) {
          sheet.cells[id] = c;
        }
      });
    });

  // add .F tags to array formula cells
  wb._arrayFormula
    .forEach(arrayRef => {
      const [ minC, minR, maxC, maxR ] = toRect(arrayRef).flat();
      const map = {};
      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          const ref = renderA1([ c, r ]);
          if (sheet.cells[ref]) {
            sheet.cells[ref].F = arrayRef;
          }
        }
      }
      return map;
    });

  delete wb._shared;
  delete wb._arrayFormula;
  delete wb._merged;
  delete wb.currentSheet;

  return sheet;
}
