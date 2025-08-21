import { attr, numAttr } from '../utils/attr.js';
import { normalizeFormula } from '../utils/normalizeFormula.js';
import { toInt } from '../utils/typecast.js';

/**
 * @param {import('@borgar/simple-xml').Document} dom
 * @param {import('../ConversionContext.js').ConversionContext} context
 * @return {import('../jsf-types.js').JSFWorkbook}
 */
export function handlerWorkbook (dom, context) {
  /** @type {import('../jsf-types.js').JSFWorkbook} */
  const wb = {
    filename: context.filename,
    sheets: [],
    names: [],
    tables: [],
    styles: [],
    // charts: [],
    calculation_properties: {
      iterate: false,
      iterate_count: 100,
      iterate_delta: 0.001
    },
    // externals: [],
    epoch: 1900
  };

  dom.querySelectorAll('sheets > sheet')
    .forEach(d => {
      context.sheetLinks.push({
        name: attr(d, 'name'),
        index: numAttr(d, 'sheetId'),
        rId: attr(d, 'r:id')
      });
    });

  dom.getElementsByTagName('definedName')
    .forEach(d => {
      const name = {
        name: attr(d, 'name'),
        value: normalizeFormula(d.textContent, context)
      };
      const localSheetId = attr(d, 'localSheetId');
      if (localSheetId) {
        name.scope = context.sheetLinks[+localSheetId].name;
      }
      wb.names.push(name);
    });

  const pr = dom.querySelectorAll('workbook > workbookPr')[0];
  wb.epoch = (pr && numAttr(pr, 'date1904')) ? 1904 : 1900;

  const calcPr = dom.getElementsByTagName('calcPr')[0];
  if (calcPr) {
    const iterate = toInt(attr(calcPr, 'iterate'));
    if (iterate && isFinite(iterate)) {
      wb.calculation_properties = {
        iterate: true,
        iterate_count: toInt(numAttr(calcPr, 'iterateCount', 100)),
        iterate_delta: numAttr(calcPr, 'iterateDelta', 0.001)
      };
    }
  }

  return wb;
}
