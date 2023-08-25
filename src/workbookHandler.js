import attr from './utils/attr.js';
import { normalizeFormula } from './utils/normalizeFormula.js';
import { toInt, toNum } from './utils/typecast.js';

export default function (dom, wb) {
  dom.querySelectorAll('sheets > sheet')
    .forEach(d => {
      wb.sheets.push({
        name: attr(d, 'name'),
        $sheetId: attr(d, 'sheetId'),
        $rId: attr(d, 'r:id')
      });
    });

  dom.getElementsByTagName('definedName')
    .forEach(d => {
      const name = {
        name: attr(d, 'name'),
        value: normalizeFormula(d.textContent, wb)
      };
      const localSheetId = attr(d, 'localSheetId');
      if (localSheetId) {
        name.scope = wb.sheets[+localSheetId].name;
      }
      wb.names.push(name);
    });

  const pr = dom.querySelectorAll('workbook > workbookPr')[0];
  wb.epoch = (pr && +attr(pr, 'date1904')) ? 1904 : 1900;

  const calcPr = dom.getElementsByTagName('calcPr')[0];
  if (calcPr) {
    const iterate = toInt(attr(calcPr, 'iterate'));
    if (iterate && isFinite(iterate)) {
      wb.calcProps = wb.makeCalcProps(
        true,
        toInt(attr(calcPr, 'iterateCount', 100)),
        toNum(attr(calcPr, 'iterateDelta', 0.001))
      );
    }
  }

  return wb;
}
