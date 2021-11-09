import attr from './utils/attr.js';
import { toInt, toNum } from './utils/typecast.js';

class Workbook {
  constructor () {
    this.names = [];
    this.sheets = [];
    this.metadata = {};
    this.filename = '';
    this.epoch = 1900;
  }

  toJSON () {
    const wb = {
      filename: this.filename || '',
      sheets: this.sheets,
      names: this.names
    };
    if (this.calcProps) {
      wb.calculation_properties = this.calcProps;
    }
    if (!this.options.cell_styles) {
      wb.styles = this.styles;
    }
    return wb;
  }
}

export default function (dom) {
  const wb = new Workbook();

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
      wb.names.push({
        name: attr(d, 'name'),
        value: d.textContent
      });
    });

  const pr = dom.querySelectorAll('workbook > workbookPr')[0];
  wb.epoch = (pr && +attr(pr, 'date1904')) ? 1904 : 1900;

  const calcPr = dom.getElementsByTagName('calcPr')[0];
  if (calcPr) {
    const iterate = toInt(attr(calcPr, 'iterate'));
    if (iterate && isFinite(iterate)) {
      wb.calcProps = {
        iterate: true,
        iterate_count: toInt(attr(calcPr, 'iterateCount', 100)),
        iterate_delta: toNum(attr(calcPr, 'iterateDelta', 0.001))
      };
    }
  }

  return wb;
}
