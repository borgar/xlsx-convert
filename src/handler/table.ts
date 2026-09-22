import type { Document } from '@borgar/simple-xml';
import type { ConversionContext } from '../ConversionContext.ts';
import { attr, boolAttr, numAttr } from '../utils/attr.ts';
import { normalizeFormula } from '../utils/normalizeFormula.ts';
import type { Table, TableColumn, TableStyle, TableStyleName } from '@jsfkit/types';
import { getFirstChild } from '../utils/getFirstChild.ts';
import {
  MISSING_TABLE_FILTER_BUTTON, MISSING_TABLE_INSERTROW, MISSING_TABLE_SORTSTATE,
  MISSING_TABLE_STYLE_CUSTOM,
} from '../constants.ts';

const reTableStyleName = /^TableStyle(Dark(\d|10|11)|Light(1?\d|20|21)|Medium(1?\d|2[0-8]))$/;

export function handlerTable (dom: Document | null | undefined, context: ConversionContext): Table | void {
  const tableElm = dom?.getElementsByTagName('table')[0];
  if (!tableElm) { return; }

  const table: Table = {
    name: attr(tableElm, 'displayName') || attr(tableElm, 'name'),
    sheet: '',
    ref: attr(tableElm, 'ref'),
    headerRowCount: numAttr(tableElm, 'headerRowCount', 1),
    totalsRowCount: numAttr(tableElm, 'totalsRowCount', 0),
    totalsRowShown: boolAttr(tableElm, 'totalsRowShown', true) ? undefined : false,
    columns: [],
    // alt text: extLst>ext>table[altTextSummary]
  };

  if (boolAttr(tableElm, 'insertRow', false)) {
    context.unsupported.add(MISSING_TABLE_INSERTROW);
  }

  // todo: table can have a sortState
  const sortState = getFirstChild(tableElm, 'sortState');
  if (sortState) { context.unsupported.add(MISSING_TABLE_SORTSTATE); }

  const autoFilter = getFirstChild(tableElm, 'autoFilter');
  if (autoFilter) {
    for (const child of autoFilter.children) {
      if (boolAttr(child, 'hiddenButton')) {
        context.unsupported.add(MISSING_TABLE_FILTER_BUTTON);
      }
    }
  }

  const tableStyleInfo = getFirstChild(tableElm, 'tableStyleInfo');
  if (tableStyleInfo) {
    // This may be a bit confusing, but here is is:
    // 1. When there is no <tableStyleInfo /> in the file, the table should be rendered using "TableStyleMedium2"
    // 2. When there is a <tableStyleInfo /> element, its name dictates the style.
    // 3. When <tableStyleInfo /> is present but does not have a name, no table styles should be used.
    const tableStyle: TableStyle = {
      name: null,
      showRowStripes: true,
      showColumnStripes: false,
      showFirstColumn: false,
      showLastColumn: false,
    };
    const name = attr(tableStyleInfo, 'name');
    if (name) {
      if (reTableStyleName.test(name)) {
        tableStyle.name = name as TableStyleName;
      }
      else {
        context.unsupported.add(MISSING_TABLE_STYLE_CUSTOM);
      }
    }
    tableStyle.showRowStripes = boolAttr(tableStyleInfo, 'showRowStripes', true);
    tableStyle.showColumnStripes = boolAttr(tableStyleInfo, 'showColumnStripes', false);
    tableStyle.showFirstColumn = boolAttr(tableStyleInfo, 'showFirstColumn', false);
    tableStyle.showLastColumn = boolAttr(tableStyleInfo, 'showLastColumn', false);

    // only add the style if it has changes from the defaults
    if (
      tableStyle.name !== 'TableStyleMedium2' ||
      !tableStyle.showRowStripes ||
      tableStyle.showColumnStripes ||
      tableStyle.showFirstColumn ||
      tableStyle.showLastColumn
    ) {
      table.style = tableStyle;
    }
  }

  tableElm
    .querySelectorAll('tableColumns > tableColumn')
    .forEach(node => {
      const column: TableColumn = {
        name: attr(node, 'name'),
        // TODO: totalsRowLabel
        // totalsRowLabel: attr(node, 'totalsRowLabel'),
      };

      /*
      { name: 'FOO',
        total: { type: 'function', value: 'average' } ??
        formula: 'XXX'
      }
      */
      // what appears in the totals row can be:
      // - a built in function:
      //   `attr(node, 'totalsRowFunction')` => "average"
      // - a custom formula:
      //   `attr(node, 'totalsRowFunction') === 'custom'`
      //   f = node.getElementsByTagName('totalsRowFormula').innerText
      // - a label:
      //   `attr(node, 'totalsRowLabel')` => "Total"

      const f = node.getElementsByTagName('calculatedColumnFormula')[0];
      if (f) {
        column.formula = normalizeFormula(f.textContent, context);
        if (attr(f, 'array') === '1') {
          column.formulaIsArray = true;
        }
      }
      table.columns.push(column);
    });

  return table;
}
