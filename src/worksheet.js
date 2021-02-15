const attr = require('./utils/attr');
const { toCol, toRect, renderA1 } = require('./utils/A1');
const handlerCell = require('./cell');

module.exports = (dom, wb) => {
  const sheet = {
    cells: {},
    col_widths: {},
    merged_cells: [],
    row_heights: {},
    hidden: false
  };

  // decode column widths
  dom.getElementsByTagName('col').forEach(d => {
    const min = +attr(d, 'min', 0); // FIXME: What is the actual min value?
    const max = +attr(d, 'max', 100000); // FIXME: What is the actual max value?
    const width = +attr(d, 'width');
    for (let i = min; i <= max; i++) {
      sheet.col_widths[toCol(i - 1)] = width;
    }
  });

  wb._shared = {};
  wb._arrayFormula = [];
  wb._merged = {};
  wb.currentSheet = sheet;

  // list merged cells
  //   <mergeCells count="1">
  //     <mergeCell ref="A2:B2"/>
  //   </mergeCells>
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

  // <row customFormat="1" r="1" s="2" spans="1:13" x14ac:dyDescent="0.2">
  //
  //  .collapsed
  //  .customFormat = 1 if the row style should be applied.
  //  .customHeight = 1 if the row height has been manually set.
  //  .hidden = 1 if the row is hidden
  //  .ht = Row height measured in point size
  //  .r = Row index. Indicates to which row in the sheet this <row> definition corresponds.
  //  .s = Style Index. Index to style record for the row (only applied if customFormat attribute is '1').
  //  .spans = Optimization only, and not required.

  // parse cells
  dom.querySelectorAll('row')
    .forEach(row => {
      // customHeight="1" ht="32"
      const r = attr(row, 'r');

      // customheight does not seem to be mandatory to read height
      const ht = attr(row, 'ht');
      if (ht != null) {
        sheet.row_heights[r] = +ht;
      }

      // context.row.z = attr(row, 'customFormat');
      row.querySelectorAll('> c').forEach(d => {
        const id = attr(d, 'r');
        if (wb._merged[id] && wb._merged[id] !== id) {
          // this cell is part of a merged range
          return;
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

  return sheet;
};
