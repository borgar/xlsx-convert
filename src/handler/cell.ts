import { tokenize, translateTokensToR1C1, stringifyTokens, type Token } from '@borgar/fx/xlsx';
import { Element } from '@borgar/simple-xml';
import { toInt, toNum } from '../utils/typecast.ts';
import { attr, boolAttr, numAttr } from '../utils/attr.ts';
import { unescape } from '../utils/unescape.ts';
import { RelativeFormula } from '../RelativeFormula.ts';
import { normalizeFormula, normalizeFormulaTokens } from '../utils/normalizeFormula.ts';
import { ConversionContext } from '../ConversionContext.ts';
import type { Cell, DataTable } from '@jsfkit/types';
import { dateToSerial } from '../utils/dateToSerial.ts';
import { UnsupportedError } from '../errors.ts';
import { ERROR_NAMES } from '../constants.ts';
import { getFirstChild } from '../utils/getFirstChild.ts';

export const relevantStyle = (obj: Record<string, any>): boolean => {
  return !!(
    // obj['number-format'] ||
    obj.fillColor ||
    obj.patternColor ||
    obj.borderTopStyle ||
    obj.borderLeftStyle ||
    obj.borderBottomStyle ||
    obj.borderRightStyle
  );
};

const parseTimeToSerial = (ts: string): number => {
  const [ , h, m, s, f ] = /^(\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?(\.\d+)?$/.exec(ts);
  return (+h / 24) + // hours
         (Number(m) / 1440) + // minutes
         (Number(s + (f || '')) / 86400); // seconds with fraction
};

function prepFormula (formula: string | RelativeFormula, cellId: string, context: ConversionContext) {
  if (formula) {
    if (context.options.cellFormulas) {
      if (typeof formula === 'string') {
        return normalizeFormula(formula, context);
      }
      return normalizeFormula(formula.translate(cellId), context);
    }
    else {
      let tokens: Token[];
      if (typeof formula === 'string') {
        tokens = tokenize(formula, { allowTernary: true });
        tokens = translateTokensToR1C1(tokens, cellId);
        normalizeFormulaTokens(tokens, context, true);
      }
      else {
        tokens = formula.getR1C1Tokens();
        normalizeFormulaTokens(tokens, context, true);
      }
      const rc = stringifyTokens(tokens);
      return context._formulasR1C1.add(rc);
    }
  }
}

// ECMA - 18.3.1.4 (Cell)
export function handlerCell (node: Element, context: ConversionContext): Cell {
  const cell: Cell = {};
  // FIXME: these props are scoped by the sheet but exist on the WB object
  //        during processing and are wiped per-sheet
  const sharedF = context._shared;

  // .r = reference (cell address)
  const address = attr(node, 'r');
  // .t = data type: The possible values for this attribute are defined by the
  //                 ST_CellType simple type (§18.18.11).
  let valueType = attr(node, 't', 'n');

  // .s = style index: The index of this cell's style.
  //                   Style records are stored in the Styles Part.
  const styleIndex = Math.trunc(numAttr(node, 's', 0));
  if (styleIndex) {
    cell.s = styleIndex;
  }

  const vNode = getFirstChild(node, 'v');
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

  if (valueType === 'inlineStr') {
    valueType = 'str';
    v = node.querySelectorAll('is t').map(d => d.textContent).join('');
  }

  // ECMA - 18.3.1.40 f (Formula)
  const fNode = getFirstChild(node, 'f');
  if (v || valueType === 'str') {
    if (valueType === 's') {
      cell.v = context.sst ? context.sst[toInt(v)] : '';
    }
    else if (valueType === 'str') {
      // Excel stores cells with formula errors like this:
      //
      //     <c r="A1" t="e" cm="1">
      //       <f t="array" aca="1" ref="A1" ca="1">FOO()</f>
      //       <v>#NAME?</v>
      //     </c>
      //
      // Whereas Google Sheets stores the same error like this:
      //
      //     <c r="A1" s="1" t="str">
      //       <f>FOO()</f>
      //       <v>#NAME?</v>
      //     </c>
      //
      // The key difference is that Excel marks the cell as having an error (`t="e"`) but Google
      // Sheets doesn't (`t="str"`). That means we have to check whether we have a formula and the
      // value looks like a known error. If it does, treat it as an error. Otherwise, it's just a
      // string.
      if (fNode && v && ERROR_NAMES.includes(v)) {
        valueType = 'e';
        cell.t = 'e';
        cell.v = v;
      }
      else {
        valueType = 's';
        cell.v = v || '';
      }
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
      // cell.t = 'd';
      if (!/[T ]/i.test(v) && v.includes(':')) {
        cell.v = parseTimeToSerial(v);
      }
      else {
        cell.v = dateToSerial(new Date(Date.parse(v))) + (
          // adjust dates if the workbook uses 1904 data system
          context.workbook?.calculationProperties?.epoch === 1904 ? -1462 : 0
        );
      }
    }
    else if (valueType === 'n') {
      const val = toNum(v);
      cell.v = val;
    }
    else {
      throw new UnsupportedError('Missing support for data type: ' + valueType);
    }
  }

  if (fNode) {
    // .t (Formula Type): [ array | dataTable | normal | shared ]
    const formulaType = attr(fNode, 't', 'normal');
    // array for array-formula
    if (formulaType === 'array') {
      // .ref (Range of Cells): Range of cells which the formula applies to.
      //   Only required for shared formula, array formula or data table.
      //   Only written on the master formula, not subsequent formulas belonging
      //   to the same shared group, array, or data table.
      //   The possible values for this attribute are defined by the
      //   ST_Ref simple type (§18.18.62).
      const cellsRange = attr(fNode, 'ref');
      if (cellsRange) {
        cell.F = cellsRange;
        context._arrayFormula.push(cellsRange);
      }
      cell.f = prepFormula(fNode.textContent, address, context);
    }
    // shared for shared formula
    else if (formulaType === 'shared') {
      // .si (Shared Group Index) - Optional attribute to optimize load
      //       performance by sharing formulas. the si attribute is used to
      //       refer to the cell containing the formula. Two formulas are
      //       considered to be the same when their respective representations
      //       in R1C1-reference notation, are the same.
      const shareGroupIndex = numAttr(fNode, 'si');
      if (!sharedF.has(shareGroupIndex)) {
        const relF = new RelativeFormula(fNode.textContent, address);
        sharedF.set(shareGroupIndex, relF);
        cell.f = prepFormula(relF, address, context);
      }
      else {
        cell.f = prepFormula(sharedF.get(shareGroupIndex), address, context);
      }
    }
    // dataTable for data table formula
    else if (formulaType.toLowerCase() === 'datatable') {
      const ref = attr(fNode, 'ref');
      const r1 = attr(fNode, 'r1');
      if (ref && r1) {
        const dt: DataTable = { ref, r1 };
        const dtr = boolAttr(fNode, 'dtr', false);
        const dt2D = boolAttr(fNode, 'dt2D', false);
        const r2 = attr(fNode, 'r2');
        if (dtr) {
          dt.dtr = true;
        }
        if (dt2D) {
          dt.dt2D = true;
        }
        if (r2) {
          dt.r2 = r2;
        }
        cell.dt = dt;
      }
    }
    else {
      cell.f = prepFormula(fNode.textContent, address, context);
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
    cell.dt == null &&
    (!cell.s || !relevantStyle(context.workbook.styles[styleIndex]))
  ) {
    return null;
  }

  return cell;
}
