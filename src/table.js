import attr from './utils/attr.js';
import { normalizeFormula } from './utils/normalizeFormula.js';

export default function (dom, wb) {
  const table = {};

  const tableElm = dom.getElementsByTagName('table')[0];
  if (!tableElm) { return; }

  table.name = attr(tableElm, 'name');
  table.sheet = '';
  table.ref = attr(tableElm, 'ref');
  table.totals_row_count = +attr(tableElm, 'totalsRowCount', 0);
  table.columns = [];

  tableElm
    .querySelectorAll('tableColumns > tableColumn')
    .forEach(node => {
      const column = { name: attr(node, 'name') };
      const f = node.getElementsByTagName('calculatedColumnFormula')[0];
      if (f) {
        column.formula = normalizeFormula(f.textContent, wb);
      }
      table.columns.push(column);
    });

  return table;
}
