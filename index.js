import convert from './src/index.js';
import { parseA1, renderA1, toRect, toCol, fromCol, contains } from './src/utils/A1.js';

const _A1 = {
  parse: parseA1,
  render: renderA1,
  parseRect: toRect,
  toCol: toCol,
  fromCol: fromCol,
  contains: contains
};

export const A1 = _A1;
export default convert;
