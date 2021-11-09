import attr from './utils/attr.js';

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

  return wb;
}
