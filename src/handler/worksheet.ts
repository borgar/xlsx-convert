import { attr, numAttr } from '../utils/attr.ts';
import { rle } from '../utils/rle.ts';
import { handlerCell, relevantStyle } from './cell.ts';
import { Document, Element } from '@borgar/simple-xml';
import { ConversionContext } from '../ConversionContext.ts';
import type { Rel } from './rels.ts';
import type { Worksheet, WorksheetLayoutScales, WorksheetView } from '@jsfkit/types';
import { colWidth } from '../utils/colWidth.ts';
import { fromA1 } from '../utils/fromA1.ts';
import { toA1 } from '../utils/toA1.ts';
import { getFirstChild } from '../utils/getFirstChild.ts';
import { toInt } from '../utils/typecast.ts';

/**
 * Extracts zoom levels (layout scales) for the different view modes for a sheet.
 *
 * Excel stores separate zoom percentages for normal view, page layout view, and page break preview.
 * Only non-default zoom values are included in the returned object.
 */
function getLayoutScales (sheetView: Element): WorksheetLayoutScales {
  const normalScale = toInt(attr(sheetView, 'zoomScaleNormal'));
  const pageLayoutScale = toInt(attr(sheetView, 'zoomScalePageLayoutView'));
  const pageBreakPreviewScale = toInt(attr(sheetView, 'zoomScaleSheetLayoutView'));
  return {
    ...(normalScale && { normal: normalScale }),
    ...(pageLayoutScale && { pageLayout: pageLayoutScale }),
    ...(pageBreakPreviewScale && { pageBreakPreview: pageBreakPreviewScale }),
  };
}

export function handlerWorksheet (dom: Document, context: ConversionContext, rels: Rel[]): Worksheet {
  const sheet: Worksheet = {
    name: '',
    cells: {},
    columns: [],
    rows: [],
    merges: [],
    defaults: {
      colWidth: colWidth(10, 5),
      rowHeight: 16,
    },
    // drawings: [],
    // showGridLines: true,
    hidden: 0,
  };

  const sheetViews = dom.querySelectorAll('sheetViews > sheetView');
  const firstSheetView = sheetViews[0];
  // FIXME: showGridLines should be stored on the sheet view.
  if (firstSheetView && attr(firstSheetView, 'showGridLines') === '0') {
    sheet.showGridLines = false;
  }

  // Store last selected cell and/or range (both optional) for each of the sheet's view. A sheet
  // view may be split into four panes, although of course most aren't. But to cover that case we
  // need to find the active pane then find its active cell. When there's only one pane (i.e. almost
  // all spreadsheets), you look for the default pane, "topLeft".
  const views: WorksheetView[] = sheetViews
    .map(sheetView => {
      const workbookView = toInt(attr(sheetView, 'workbookViewId'));
      const activeLayout = attr(sheetView, 'view') as WorksheetView['activeLayout'];
      const pane = getFirstChild(sheetView, 'pane');
      const activePane = pane ? attr(pane, 'activePane', 'topLeft') : 'topLeft';
      const selection = sheetView.querySelectorAll('selection')
        .find(el => attr(el, 'pane', 'topLeft') === activePane);

      let activeCell: string | null = null;
      let activeRanges: string[] | null = null;
      let hasUsefulRange = false;
      if (selection) {
        activeCell = attr(selection, 'activeCell');
        activeRanges = attr(selection, 'sqref', '').trim().split(' ').filter(Boolean);
        hasUsefulRange = activeRanges &&
          (activeRanges[0] !== activeCell || activeRanges.length !== 1);
      }

      const layoutScales = getLayoutScales(sheetView);
      const hasLayoutScale = Object.keys(layoutScales).length > 0;

      const view = {
        workbookView,
        ...(activeLayout && { activeLayout }),
        ...(activeCell && { activeCell }),
        ...(hasUsefulRange && { activeRanges }),
        ...(hasLayoutScale && { layoutScales }),
      };

      // Filter out views that contain only a workbook view id with no actual view state data. An id
      // alone isn't useful since it's just an index pointer. We only keep views that have at least
      // one piece of meaningful, non-default, data.
      if (Object.keys(view).length > 1) {
        return view;
      }
      else {
        return null;
      }
    })
    .filter(view => view !== null);

  if (views.length) {
    sheet.views = views;
  }

  // read hyperlinks
  const hyperLinks = new Map<string, string>();
  dom.querySelectorAll('hyperlinks > hyperlink').forEach(d => {
    const relId = attr(d, 'r:id');
    const rel = rels.find(item => item.id === relId);
    hyperLinks.set(attr(d, 'ref'), rel?.target);
  });

  // find default col/row sizes
  const sheetFormatPr = getFirstChild(dom.root, 'sheetFormatPr');
  if (sheetFormatPr) {
    const baseColWidthChars = numAttr(sheetFormatPr, 'baseColWidth', null);
    const defaultColWidthChars = numAttr(sheetFormatPr, 'defaultColWidth', null);
    sheet.defaults.colWidth =
      colWidth(defaultColWidthChars, 0) ??
      colWidth(baseColWidthChars, 5) ??
      colWidth(10, 5);
  }

  // decode column widths (3.3.1.12)
  getFirstChild(dom.root, 'cols')?.children.forEach(d => {
    if (d.tagName !== 'col') { return; }
    const min = numAttr(d, 'min', 0);
    const max = numAttr(d, 'max', 100000); // FIXME: What is the actual max value?
    const hidden = numAttr(d, 'hidden', 0);
    sheet.columns.push({
      start: min,
      end: max,
      size: colWidth(hidden ? 0 : numAttr(d, 'width')),
    });
  });

  context._shared = new Map();
  context._arrayFormula = [];
  context._merged = {};

  // list merged cells
  getFirstChild(dom.root, 'mergeCells')?.children.forEach(d => {
    if (d.tagName !== 'mergeCell') { return; }
    const ref = attr(d, 'ref');
    const { top, left, bottom, right } = fromA1(ref);
    const anchor = toA1(left, top);
    for (let c = left; c <= right; c++) {
      for (let r = top; r <= bottom; r++) {
        context._merged[toA1(c, r)] = anchor;
      }
    }
    sheet.merges.push(ref);
  });

  // keep a list of row heights
  const row_heights: [ number, number ][] = [];

  // parse cells
  getFirstChild(dom.root, 'sheetData')?.children.forEach(row => {
    if (row.tagName !== 'row') { return; }
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
    // row.querySelectorAll('> c').forEach(d => {
    row.childNodes.forEach(d => {
      if (!(d instanceof Element) || d.nodeName !== 'C') {
        return;
      }
      const id = attr(d, 'r');
      const c = handlerCell(d, context);
      if (context.options.skipMerged && id) {
        if (context._merged[id] && context._merged[id] !== id) {
          // check if there are needed styles
          if (!c || !('s' in c) || !relevantStyle(context.workbook.styles[c.s])) {
            // this cell is part of a merged range and has no required styles
            return;
          }
        }
      }
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
  context._arrayFormula.forEach(arrayRef => {
    const { top, left, bottom, right } = fromA1(arrayRef);
    for (let r = top; r <= bottom; r++) {
      for (let c = left; c <= right; c++) {
        const ref = toA1(c, r);
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
