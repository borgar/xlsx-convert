const numfmt = require('numfmt');
const { toInt, toNum } = require('./utils/typecast');
const attr = require('./utils/attr');
const unescape = require('./utils/unescape');
const RelativeFormula = require('./RelativeFormula');

const fixNameSpace = fx => {
  return fx.replace(/\b(_xlfn|_xlws)\.\b/g, '');
};

const relevantStyle = obj => {
  return !!(
    // obj['number-format'] ||
    obj['fill-color'] ||
    obj['border-top-style'] ||
    obj['border-left-style'] ||
    obj['border-bottom-style'] ||
    obj['border-right-style']
  );
};

// ECMA - 18.3.1.4 (Cell)
module.exports = (node, wb) => {
  const cell = {};
  const { cell_styles, cell_z } = wb.options;

  // FIXME: these props are scoped by the sheet but exist on the WB object during processing and are wiped per-sheet
  const sharedF = wb._shared || {};
  const comments = wb.comments || {};
  const arrayFormula = wb._arrayFormula || [];

  // .r = reference (cell address)
  const address = attr(node, 'r');
  // .t = data type: The possible values for this attribute are defined by the ST_CellType simple type (§18.18.11).
  let type = attr(node, 't', 'n');

  // .s = style index: The index of this cell's style. Style records are stored in the Styles Part.
  const styleIndex = toInt(attr(node, 's', 0));
  if (styleIndex) {
    if (cell_styles) {
      cell.s = Object.assign({}, wb.styles[styleIndex]);
      if (cell_z) {
        const z = wb.styles[styleIndex]['number-format'];
        if (z) {
          cell.z = z;
        }
        delete cell.s['number-format'];
      }
    }
    else {
      cell.si = styleIndex;
      if (cell_z) {
        const z = wb.styles[styleIndex]['number-format'];
        if (z) { cell.z = z; }
      }
    }
  }

  const vNode = node.querySelectorAll('> v')[0];
  let v = vNode ? vNode.textContent : null;

  // .vm = value metadata index: The zero-based index of the value metadata record associated with this cell's value
  const vm = attr(node, 'vm');
  if (vm && wb.metadata) {
    const meta = wb.metadata.values[vm - 1];
    if (meta._type === '_error') {
      type = 'e';
      // TODO: some of these may have .subType, does is matter?
      if (meta.errorType === 8) {
        v = '#SPILL!';
      }
      else if (meta.errorType === 11) {
        v = '#UNKNOWN!';
      }
      else if (meta.errorType === 12) {
        v = '#FIELD!';
      }
      else if (meta.errorType === 13) {
        v = '#CALC!';
      }
    }
  }

  if (comments[address]) {
    cell.c = comments[address];
  }

  // ECMA - 18.3.1.40 f (Formula)
  const fNode = node.querySelectorAll('> f')[0];
  if (fNode) {
    // .t (Formula Type): [ array | dataTable | normal | shared ]
    const formulaType = attr(fNode, 't', 'normal');
    let f = null;
    // array for array-formula
    if (formulaType === 'array') {
      // .ref (Range of Cells): Range of cells which the formula applies to.
      //   Only required for shared formula, array formula or data table.
      //   Only written on the master formula, not subsequent formulas belonging
      //   to the same shared group, array, or data table.
      //   The possible values for this attribute are defined by the ST_Ref simple type (§18.18.62).
      const cellsRange = attr(fNode, 'ref');
      if (cellsRange && cellsRange !== address) {
        cell.F = cellsRange;
        arrayFormula.push(cellsRange);
      }
      f = fNode.textContent;
    }
    // shared for shared formula
    else if (formulaType === 'shared') {
      // .si (Shared Group Index) - Optional attribute to optimize load performance by sharing formulas.
      //       the si attribute is used to refer to the cell containing the formula.
      //       Two formulas are considered to be the same when their respective
      //       representations in R1C1-reference notation, are the same.
      const shareGroupIndex = attr(fNode, 'si');
      if (!sharedF[shareGroupIndex]) {
        sharedF[shareGroupIndex] = new RelativeFormula(fixNameSpace(fNode.textContent), address);
      }
      f = sharedF[shareGroupIndex].translate(address);
    }
    // dataTable for data table formula
    else if (formulaType.toLowerCase() === 'datatable') {
      // .dt2D (Data Table 2- D)
      // .dtr (Data Table Row)
      // .dtr (Data Table Row)
      // .r2 (Input Cell 2)
      // FIXME: support dataTable formula
    }
    else {
      f = fNode.textContent;
    }
    if (f) {
      cell.f = fixNameSpace(f);
    }
  }

  if (type === 'inlineStr') {
    type = 'str';
    v = node.querySelectorAll('is t').map(d => d.textContent).join('');
  }
  if (v || type === 'str') {
    if (type === 's') {
      cell.v = wb.sst ? wb.sst[toInt(v)] : '';
    }
    else if (type === 'str') {
      type = 's';
      cell.v = v || '';
    }
    else if (type === 'b') {
      cell.v = !!toInt(v);
    }
    else if (type === 'e') {
      // FIXME: ensure error is a known error!
      cell.v = v;
    }
    else if (type === 'n') {
      let val = toNum(v);
      // adjust dates if the workbook uses 1904 data system
      if (wb.epoch === 1904 && styleIndex) {
        const z = wb.styles[styleIndex] && wb.styles[styleIndex]['number-format'];
        if (z && numfmt.isDate(z)) {
          val += 1462;
        }
      }
      cell.v = val;
    }
    else {
      throw new Error('Missing support for data type: ' + type);
    }
  }

  // unescape the strange OOXML character escaping (seems only used for <32 ASCII codes?)
  if (typeof cell.v === 'string') {
    cell.v = unescape(cell.v);
  }

  // don't emit the cell if it is empty
  if (
    cell.v == null &&
    cell.f == null &&
    (!cell.si || !relevantStyle(wb.styles[styleIndex]))
  ) {
    return null;
  }

  return cell;
};
