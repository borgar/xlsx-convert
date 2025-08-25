import { dateToSerial, isDateFormat } from 'numfmt';
import { toInt, toNum } from '../utils/typecast.ts';
import { attr, numAttr } from '../utils/attr.ts';
import { unescape } from '../utils/unescape.ts';
import { RelativeFormula } from '../RelativeFormula.ts';
import { normalizeFormula } from '../utils/normalizeFormula.ts';
import { Element } from '@borgar/simple-xml';
import { ConversionContext } from '../ConversionContext.ts';
import type { JSFCell } from '../jsf-types.ts';

/**
 * @param {Record<string, any>} obj
 * @return {boolean}
 */
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
export function handlerCell (node: Element, context: ConversionContext): JSFCell {
  const cell: JSFCell = {};

  // FIXME: these props are scoped by the sheet but exist on the WB object
  //        during processing and are wiped per-sheet
  const sharedF = context._shared;
  const comments = context.comments;
  const arrayFormula = context._arrayFormula;

  // .r = reference (cell address)
  const address = attr(node, 'r');
  // .t = data type: The possible values for this attribute are defined by the
  //                 ST_CellType simple type (§18.18.11).
  let valueType = attr(node, 't', 'n');

  // .s = style index: The index of this cell's style.
  //                   Style records are stored in the Styles Part.
  const styleIndex = Math.trunc(numAttr(node, 's', 0));
  if (styleIndex) {
    cell.si = styleIndex;
  }

  const vNode = node.querySelectorAll('> v')[0];
  let v = vNode ? vNode.textContent : null;

  // .vm = value metadata index: The zero-based index of the value metadata
  //                             record associated with this cell's value
  const vm = numAttr(node, 'vm');
  if (vm && context.metadata) {
    const meta = context.metadata.values[vm - 1];
    if (meta._type === '_error') {
      valueType = 'e';
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

  if (valueType === 'inlineStr') {
    valueType = 'str';
    v = node.querySelectorAll('is t').map(d => d.textContent).join('');
  }
  if (v || valueType === 'str') {
    if (valueType === 's') {
      cell.v = context.sst ? context.sst[toInt(v)] : '';
    }
    else if (valueType === 'str') {
      valueType = 's';
      cell.v = v || '';
    }
    else if (valueType === 'b') {
      cell.v = !!toInt(v);
    }
    else if (valueType === 'e') {
      // FIXME: ensure error is a known error!
      cell.v = v;
      cell.t = 'e';
    }
    else if (valueType === 'd') {
      if (!/[T ]/i.test(v) && v.includes(':')) {
        // this is time only so prefix with Excel epoch date
        v = '1899-12-31T' + v;
      }
      cell.v = dateToSerial(new Date(Date.parse(v)));
    }
    else if (valueType === 'n') {
      let val = toNum(v);
      // adjust dates if the workbook uses 1904 data system
      if (context.workbook && context.workbook.epoch === 1904 && styleIndex) {
        const z = context.workbook.styles[styleIndex]?.['number-format'];
        if (z && isDateFormat(z)) {
          val += 1462;
        }
      }
      cell.v = val;
    }
    else {
      throw new Error('Missing support for data type: ' + valueType);
    }
  }

  // ECMA - 18.3.1.40 f (Formula)
  const fNode = node.querySelectorAll('> f')[0];
  if (fNode) {
    // .t (Formula Type): [ array | dataTable | normal | shared ]
    const formulaType = attr(fNode, 't', 'normal');
    let f: string | null = null;
    // array for array-formula
    if (formulaType === 'array') {
      // .ref (Range of Cells): Range of cells which the formula applies to.
      //   Only required for shared formula, array formula or data table.
      //   Only written on the master formula, not subsequent formulas belonging
      //   to the same shared group, array, or data table.
      //   The possible values for this attribute are defined by the
      //   ST_Ref simple type (§18.18.62).
      const cellsRange = attr(fNode, 'ref');
      if (cellsRange && cellsRange !== address) {
        cell.F = cellsRange;
        arrayFormula.push(cellsRange);
      }
      f = fNode.textContent;
    }
    // shared for shared formula
    else if (formulaType === 'shared') {
      // .si (Shared Group Index) - Optional attribute to optimize load
      //       performance by sharing formulas. the si attribute is used to
      //       refer to the cell containing the formula. Two formulas are
      //       considered to be the same when their respective representations
      //       in R1C1-reference notation, are the same.
      const shareGroupIndex = attr(fNode, 'si');
      if (!sharedF[shareGroupIndex]) {
        sharedF[shareGroupIndex] = new RelativeFormula(fNode.textContent, address);
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      f = sharedF[shareGroupIndex].translate(address);
    }
    // dataTable for data table formula
    else if (formulaType.toLowerCase() === 'datatable') {
      // .dt2D (Data Table 2- D)
      // .dtr (Data Table Row)
      // .dtr (Data Table Row)
      // .r2 (Input Cell 2)
      // FIXME: support dataTable formula
      // console.log('dataTable formula');
    }
    else {
      f = fNode.textContent;
    }

    if (f) {
      cell.f = normalizeFormula(f, context);
    }
  }

  // unescape the strange OOXML character escaping
  // (seems only used for <32 ASCII codes?)
  if (typeof cell.v === 'string') {
    cell.v = unescape(cell.v);
  }

  // don't emit the cell if it is empty
  if (
    cell.v == null &&
    cell.f == null &&
    (!cell.si || !relevantStyle(context.workbook.styles[styleIndex]))
  ) {
    return null;
  }

  return cell;
}
