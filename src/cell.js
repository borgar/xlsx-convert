const { toInt, toNum } = require('./utils/typecast');
const attr = require('./utils/attr');
const convertStyles = require('./utils/convertStyles');
const unescape = require('./utils/unescape');
const RelativeFormula = require('./RelativeFormula');

const fixNameSpace = fx => {
  return fx.replace(/\b(_xlfn|_xlws)\.\b/g, '');
};

// ECMA - 18.3.1.4 (Cell)
module.exports = (node, wb) => {
  const cell = {};

  // FIXME: these props are scoped by the sheet but exist on the WB object during processing and are wiped per-sheet
  const sharedF = wb._shared || {};
  const comments = wb.comments || {};
  const arrayFormula = wb._arrayFormula || [];

  // .r = reference (address)
  const address = attr(node, 'r');
  // .t = data type: The possible values for this attribute are defined by the ST_CellType simple type (§18.18.11).
  let type = attr(node, 't', 'n');

  // .s = style index: The index of this cell's style. Style records are stored in the Styles Part.
  const styleIndex = toInt(attr(node, 's', 0));
  const style = wb.styles.cellXf[styleIndex];
  if (style.numFmtId) {
    const numFmt = wb.styles.numFmts[style.numFmtId];
    if (numFmt.toLowerCase() !== 'general') {
      cell.z = numFmt;
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
  // .dt2D (Data Table 2- D)
  // .dtr (Data Table Row)
  // .dtr (Data Table Row)
  // .r2 (Input Cell 2)
  const fNode = node.querySelectorAll('> f')[0];
  if (fNode) {
    // .t (Formula Type):
    //   array = Array formula
    //   dataTable = Data table
    //   normal = Normal cell formula
    //   shared = Shared formula
    //       the si attribute is used to refer to the cell containing the formula.
    //       Two formulas are considered to be the same when their respective
    //       representations in R1C1-reference notation, are the same.
    const formulaType = attr(fNode, 't');
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
    }
    // shared for stared formula
    if (formulaType === 'shared') {
      // .si (Shared Group Index)
      //   Optional attribute to optimize load performance by sharing formulas.
      const shareGroupIndex = attr(fNode, 'si');
      if (!sharedF[shareGroupIndex]) {
        sharedF[shareGroupIndex] = new RelativeFormula(fixNameSpace(fNode.textContent), address);
      }
      cell.f = sharedF[shareGroupIndex].translate(address);
    }
    else {
      cell.f = fixNameSpace(fNode.textContent);
    }
  }

  // FIXME: support inlineStr
  // While a cell can have a formula element f and a value element v,
  // when the cell's type t is inlineStr then the only the element is
  // allowed as a child element.
  //   <row r="1" spans="1:1">
  //     <c r="A1" t="inlineStr">
  //       <is><t>This is inline string example</t></is>
  //     </c>
  //   </row>
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
      cell.v = toNum(v);
    }
    else {
      throw new Error('Missing support for data type: ' + type);
    }
  }

  // unescape the strange OOXML character escaping (seems only used for <32 ASCII codes?)
  if (typeof cell.v === 'string') {
    cell.v = unescape(cell.v);
  }

  if (cell.f === '') {
    delete cell.f;
  }

  const have_content = cell.v != null || cell.f != null;
  if (style && wb.options.styles) {
    cell.s = convertStyles(style, have_content);
  }

  if (!have_content && cell.s == null && cell.c == null) {
    return null;
  }

  return cell;
};
