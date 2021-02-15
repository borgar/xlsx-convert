const attr = require('./utils/attr');

class Workbook {
  constructor () {
    this.names = [];
    this.sheets = [];
    this.metadata = {};
    this.filename = '';
  }

  toJSON () {
    return {
      filename: this.filename || '',
      names: this.names,
      sheets: this.sheets,
      metadata: this.metadata
    };
  }
}

module.exports = dom => {
  const wb = new Workbook();

  dom.getElementsByTagName('sheet')
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

  return wb;
};
