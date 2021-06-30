const convert = require('./src');
const { parseA1, renderA1, toRect, toCol, fromCol, contains } = require('./src/utils/A1');

convert.A1 = {
  parse: parseA1,
  render: renderA1,
  parseRect: toRect,
  toCol: toCol,
  fromCol: fromCol,
  contains: contains
};

module.exports = convert;
