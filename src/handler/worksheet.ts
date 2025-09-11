import { parseA1Ref, stringifyA1Ref } from '@borgar/fx';
import { attr, numAttr } from '../utils/attr.ts';
import { rle } from '../utils/rle.ts';
import { handlerCell } from './cell.ts';
import { Document } from '@borgar/simple-xml';
import { ConversionContext } from '../ConversionContext.ts';
import type { Rel } from './rels.ts';
import type { JSFWorksheet } from '../jsf-types.ts';

const COL_MULT = 6.5;

export function handlerWorksheet (dom: Document, context: ConversionContext, rels: Rel[]): JSFWorksheet {
  const sheet: JSFWorksheet = {
    name: '',
    cells: {},
    columns: [],
    rows: [],
    merges: [],
    defaults: {
      colWidth: 10 * COL_MULT,
      rowHeight: 16,
    },
    // drawings: [],
    // showGridLines: true,
    hidden: 0,
  };

  const sheetView = dom.querySelector('sheetViews > sheetView');
  // zoomScale/zoomScaleNormal
  if (attr(sheetView, 'showGridLines') === '0') {
    sheet.showGridLines = false;
  }

  // read hyperlinks
  const hyperLinks = new Map<string, string>();
  dom.querySelectorAll('hyperlinks > hyperlink').forEach(d => {
    const relId = attr(d, 'r:id');
    const rel = rels.find(item => item.id === relId);
    hyperLinks.set(attr(d, 'ref'), rel?.target);
  });

  // find default col/row sizes
  const sheetFormatPr = dom.getElementsByTagName('sheetFormatPr')[0];
  if (sheetFormatPr) {
    // baseColWidth is also a thing but how it is used is not very clear in the spec.
    sheet.defaults.colWidth = numAttr(sheetFormatPr, 'defaultColWidth', sheet.defaults.colWidth);
    sheet.defaults.rowHeight = numAttr(sheetFormatPr, 'defaultRowHeight', sheet.defaults.rowHeight);
  }

  // decode column widths (3.3.1.12)
  dom.getElementsByTagName('col').forEach(d => {
    const min = numAttr(d, 'min', 0);
    const max = numAttr(d, 'max', 100000); // FIXME: What is the actual max value?
    const hidden = numAttr(d, 'hidden', 0);
    const width = hidden ? 0 : numAttr(d, 'width') * COL_MULT; // width is given in points (height in px)
    sheet.columns.push({
      start: min,
      end: max,
      size: width,
    });
  });

  context._shared = {};
  context._arrayFormula = [];
  context._merged = {};

  // list merged cells
  dom.getElementsByTagName('mergeCell')
    .forEach(d => {
      const ref = attr(d, 'ref');
      const { top, left, bottom, right } = parseA1Ref(ref).range;
      const anchor = stringifyA1Ref({ range: { top, left } });
      for (let c = left; c <= right; c++) {
        for (let r = top; r <= bottom; r++) {
          context._merged[stringifyA1Ref({ range: { top: r, left: c } })] = anchor;
        }
      }
      sheet.merges.push(ref);
    });

  // keep a list of row heights
  const row_heights: [ number, number ][] = [];

  // parse cells
  dom.querySelectorAll('row')
    .forEach(row => {
      // .r = Row index. Indicates to which row in the sheet this
      //                 <row> definition corresponds.
      const r = attr(row, 'r');

      // .hidden = 1 if the row is hidden (.collapsed also exists)
      // .ht = Row height measured in point size
      const isHidden = numAttr(row, 'hidden');
      if (isHidden) {
        row_heights.push([ +r, 0 ]);
      }
      else {
        // Row height measured in point size
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
        if (context.options.skipMerged) {
          if (context._merged[id] && context._merged[id] !== id) {
            // this cell is part of a merged range
            return;
          }
        }
        const c = handlerCell(d, context);
        if (c) {
          if (hyperLinks.has(id)) {
            c.l = hyperLinks.get(id);
          }
          sheet.cells[id] = c;
        }
      });
    });

  // run-length encode the row heights
  sheet.rows = rle(row_heights, sheet.defaults.rowHeight);

  // add .F tags to array formula cells
  context._arrayFormula
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

  delete context._shared;
  delete context._arrayFormula;
  delete context._merged;

  return sheet;
}
