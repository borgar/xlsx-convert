export default class Workbook {
  constructor () {
    this.names = [];
    this.sheets = [];
    this.metadata = {};
    this.tables = [];
    this.externalLinks = [];
    this.filename = '';
    this.epoch = 1900;
  }

  makeCalcProps (on = false, count = 100, delta = 0.001) {
    return {
      iterate: on,
      iterate_count: count,
      iterate_delta: delta
    };
  }

  toJSON () {
    const wb = {
      filename: this.filename || '',
      sheets: this.sheets,
      names: this.names,
      tables: this.tables
    };
    wb.calculation_properties = this.calcProps || this.makeCalcProps();
    if (!this.options.cell_styles) {
      wb.styles = this.styles;
    }
    if (this.externalLinks.length) {
      wb.externals = this.externalLinks;
    }
    return wb;
  }
}
