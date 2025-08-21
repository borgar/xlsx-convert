import { attr, numAttr } from '../utils/attr.js';
import { normalizeFormula } from '../utils/normalizeFormula.js';

/**
 * @param {import('@borgar/simple-xml').Document} dom
 * @param {import('../ConversionContext.js').ConversionContext} context
 * @return {import('../jsf-types.js').JSFTable | void}
 */
export function handlerTable (dom, context) {
  const tableElm = dom.getElementsByTagName('table')[0];
  if (!tableElm) { return; }

  /** @type {import('../jsf-types.js').JSFTable} */
  const table = {
    name: attr(tableElm, 'name'),
    sheet: '',
    ref: attr(tableElm, 'ref'),
    header_row_count: numAttr(tableElm, 'headerRowCount', 1),
    totals_row_count: numAttr(tableElm, 'totalsRowCount', 0), // totalsRowShown
    columns: []
    // alt text: extLst>ext>table[altTextSummary]
  };

  // table has a sortState
  // table has props for: row/col stripes, bold first/last column

  tableElm
    .querySelectorAll('tableColumns > tableColumn')
    .forEach(node => {
      const column = {
        name: attr(node, 'name')
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
