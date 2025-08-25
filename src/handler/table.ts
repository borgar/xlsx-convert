import type { Document } from '@borgar/simple-xml';
import type { ConversionContext } from '../ConversionContext.ts';
import { attr, numAttr } from '../utils/attr.ts';
import { normalizeFormula } from '../utils/normalizeFormula.ts';
import type { JSFTable, JSFTableColumn } from '../jsf-types.js';

export function handlerTable (dom: Document, context: ConversionContext): JSFTable | void {
  const tableElm = dom.getElementsByTagName('table')[0];
  if (!tableElm) { return; }

  const table: JSFTable = {
    name: attr(tableElm, 'name'),
    sheet: '',
    ref: attr(tableElm, 'ref'),
    header_row_count: numAttr(tableElm, 'headerRowCount', 1),
    totals_row_count: numAttr(tableElm, 'totalsRowCount', 0), // totalsRowShown
    columns: [],
    // alt text: extLst>ext>table[altTextSummary]
  };

  // table has a sortState
  // table has props for: row/col stripes, bold first/last column

  tableElm
    .querySelectorAll('tableColumns > tableColumn')
    .forEach(node => {
      const column: JSFTableColumn = {
        name: attr(node, 'name'),
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
      }
      table.columns.push(column);
    });

  return table;
}
