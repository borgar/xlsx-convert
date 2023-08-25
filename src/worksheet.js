import attr from './utils/attr.js';
import { rle } from './utils/rle.js';
import handlerCell from './cell.js';
import { parseA1Ref, stringifyA1Ref } from '@borgar/fx';

export default function (dom, wb, rels) {
  const sheet = {
    name: '',
    cells: {},
    columns: [],
    rows: [],
    merged_cells: [],
    defaults: {
      col_width: 10,
      row_height: 16
    },
    hidden: false
  };

  // read hyperlinks
  const hyperLinks = Object.create(null);
  dom.querySelectorAll('hyperlinks > hyperlink').forEach(d => {
    const relId = attr(d, 'r:id');
    const rel = rels.find(item => item.id === relId);
    hyperLinks[attr(d, 'ref')] = rel && rel.target;
  });

  // find default col/row sizes
  const sheetFormatPr = dom.getElementsByTagName('sheetFormatPr')[0];
  if (sheetFormatPr) {
    sheet.defaults.col_width = +attr(sheetFormatPr, 'baseColWidth', sheet.defaults.col_width);
    sheet.defaults.row_height = +attr(sheetFormatPr, 'defaultRowHeight', sheet.defaults.row_height);
  }

  // decode column widths
  dom.getElementsByTagName('col').forEach(d => {
    const min = +attr(d, 'min', 0);
    const max = +attr(d, 'max', 100000); // FIXME: What is the actual max value?
    const hidden = +attr(d, 'hidden', 0);
    const width = hidden ? 0 : +attr(d, 'width');
    sheet.columns.push({
      begin: min,
      end: max,
      size: width
    });
  });

  wb._shared = {};
  wb._arrayFormula = [];
  wb._merged = {};
  wb.currentSheet = sheet;

  // list merged cells
  dom.getElementsByTagName('mergeCell')
    .forEach(d => {
      const ref = attr(d, 'ref');
      const { top, left, bottom, right } = parseA1Ref(ref).range;
      const anchor = stringifyA1Ref({ range: { top, left } });
      for (let c = left; c <= right; c++) {
        for (let r = top; r <= bottom; r++) {
          wb._merged[stringifyA1Ref({ range: { top: r, left: c } })] = anchor;
        }
      }
      sheet.merged_cells.push(ref);
    });

  // keep a list of row heights
  const row_heights = [];

  // parse cells
  dom.querySelectorAll('row')
    .forEach(row => {
      // .r = Row index. Indicates to which row in the sheet this
      //                 <row> definition corresponds.
      const r = attr(row, 'r');

      // .hidden = 1 if the row is hidden (.collapsed also exists)
      // .ht = Row height measured in point size
      const isHidden = +attr(row, 'hidden');
      if (isHidden) {
        row_heights.push([ +r, 0 ]);
      }
      else {
        const ht = attr(row, 'ht');
        if (ht != null) {
          row_heights.push([ +r, +ht ]);
        }
      }

      // FIXME: rows have styles:
      // .customFormat = 1 if the row style should be applied.
      // .s = Style Index. Index to style record for the row
      //                   (only applied if customFormat attribute is '1').

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
          if (hyperLinks[id]) {
            c.href = hyperLinks[id];
          }
          sheet.cells[id] = c;
        }
      });
    });

  // run-length encode the row heights
  sheet.rows = rle(row_heights, sheet.defaults.row_height);

  // add .F tags to array formula cells
  wb._arrayFormula
    .forEach(arrayRef => {
      const { top, left, bottom, right } = parseA1Ref(arrayRef).range;
      for (let r = top; r <= bottom; r++) {
        for (let c = left; c <= right; c++) {
          const ref = stringifyA1Ref({ range: { top: r, left: c } });
          if (sheet.cells[ref]) {
            sheet.cells[ref].F = arrayRef;
          }
        }
      }
    });

  delete wb._shared;
  delete wb._arrayFormula;
  delete wb._merged;
  delete wb.currentSheet;

  return sheet;
}
