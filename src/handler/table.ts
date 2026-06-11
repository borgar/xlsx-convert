import type { Document } from '@borgar/simple-xml';
import type { ConversionContext } from '../ConversionContext.ts';
import { attr, boolAttr, numAttr } from '../utils/attr.ts';
import { normalizeFormula } from '../utils/normalizeFormula.ts';
import type { Table, TableColumn, TableStyle } from '@jsfkit/types';

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

  // todo: table can have a sortState

  const tableStyleInfo = tableElm.getElementsByTagName('tableStyleInfo')[0];
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
    // Any name is preserved as-is, not just the built-in TableStyleName union: a custom
    // (workbook-defined) style name refers to a definition in Workbook.tableStyles.
    const name = attr(tableStyleInfo, 'name');
    if (name) {
      tableStyle.name = name;
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
