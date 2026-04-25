import {
  isFunction, isReference, parseA1Ref, parseStructRef,
  tokenTypes, tokenize, parseR1C1Ref,
  type ReferenceStructXlsx,
  type ReferenceA1Xlsx,
  type Token,
  stringifyTokens,
  isWhitespace,
  isRange,
} from '@borgar/fx/xlsx';
import {
  stringifyA1Ref as stringifyA1RefCtx,
  stringifyStructRef as stringifyStructRefCtx,
  stringifyR1C1Ref as stringifyR1C1RefCtx,
  type ReferenceStruct,
  type ReferenceA1,
  type ReferenceName,
  type ReferenceNameXlsx,
  type ReferenceR1C1Xlsx,
  type ReferenceR1C1,
} from '@borgar/fx';

type ExternalSubset = { name: string };
type ConversionContextSubset = {
  externalLinks: ExternalSubset[];
  preservePrefixes?: boolean;
  preserveCompatibilityFunctions?: boolean;
};

/**
 * Updates a reference:
 * - Translates from xlsx reference notation to context notation: [wb1]!A1 => wb!A1
 * - Handles rewriting external ref numbers to names: [1]!A1 => [wb.xlsx]!A1
 */
function updateContext (
  ref: ReferenceStructXlsx | ReferenceR1C1Xlsx | ReferenceA1Xlsx | ReferenceNameXlsx,
  externalLinks?: ExternalSubset[] | null,
): ReferenceStruct | ReferenceR1C1 | ReferenceA1 | ReferenceName {
  const context: string[] = [];
  if (ref.workbookName && isFinite(+ref.workbookName)) {
    const wbIndex = +ref.workbookName - 1;
    if (externalLinks?.[wbIndex]) {
      context.push(externalLinks[wbIndex].name);
    }
    else {
      throw new Error('#REF!');
    }
  }
  if (ref.sheetName) {
    context.push(ref.sheetName);
  }
  // @ts-ignore -- we're switching from xlsx to context mode here
  ref.context = context;
  return ref;
}

function findSubExpressionEnd (tokens: Token[], startIndex = 0) {
  const stack = [];
  for (let i = startIndex; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.value === '(' || t.value === '{') {
      stack.push(t.value);
    }
    else if (t.value === ')' || t.value === '}') {
      const exp = stack.pop();
      if (
        (t.value === ')' && exp === '(') ||
        (t.value === '}' && exp === '{')) {
        if (!stack.length) {
          return i;
        }
      }
      else {
        // paren mismatch
        break;
      }
    }
  }
  return -1;
}

function trimExpression (tokens: Token[]): Token[] {
  const t = tokens.concat();
  while (isWhitespace(t.at(0))) { t.shift(); }
  while (isWhitespace(t.at(-1))) { t.pop(); }
  return t;
}

function updateRangeToken (
  token: Token,
  trim: 'both' | 'head' | 'tail',
  externalLinks?: ExternalSubset[],
  r1c1 = false,
): Token {
  if (r1c1) {
    const ref = updateContext(parseR1C1Ref(token.value), externalLinks);
    if (trim && 'range' in ref) {
      ref.range.trim = trim;
    }
    token.value = stringifyR1C1RefCtx(ref as ReferenceR1C1 | ReferenceName);
  }
  else {
    const ref = updateContext(parseA1Ref(token.value), externalLinks);
    if (trim && 'range' in ref) {
      ref.range.trim = trim;
    }
    token.value = stringifyA1RefCtx(ref as ReferenceA1 | ReferenceName);
  }
  return token;
}

const TRIM_OPS = {
  '_xlfn._TRO_ALL': 'both',
  '_TRO_ALL': 'both',
  '_xlfn._TRO_LEADING': 'head',
  '_TRO_LEADING': 'head',
  '_xlfn._TRO_TRAILING': 'tail',
  '_TRO_TRAILING': 'tail',
};

export function normalizeFormulaTokens (
  tokens: Token[], wb?: ConversionContextSubset | null, r1c1 = false,
): Token[] {
  const preservePrefixes = wb?.preservePrefixes;
  const preserveCompatFns = wb?.preserveCompatibilityFunctions;
  const outTokens = [];

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    if (isFunction(t)) {
      const isSingle = t.value === '_xlfn.SINGLE' || t.value === 'SINGLE';
      const isAnchorarray = t.value === '_xlfn.ANCHORARRAY' || t.value === 'ANCHORARRAY';
      // Excel stores # and @ operators as functions.
      if ((isSingle || isAnchorarray) && !preserveCompatFns) {
        const j = findSubExpressionEnd(tokens, i);
        if (j >= 0) {
          const subExpression = trimExpression(tokens.slice(i + 2, j));
          if (isSingle) { outTokens.push({ type: tokenTypes.OPERATOR, value: '@' }); }
          outTokens.push(...normalizeFormulaTokens(subExpression, wb, r1c1));
          if (isAnchorarray) { outTokens.push({ type: tokenTypes.OPERATOR, value: '#' }); }
          i = j;
        }
        else {
          // We cannot determine sub-expression, so preserve the token instead.
          outTokens.push(t);
        }
      }
      // Excel stores trim range operators as functions.
      else if (t.value in TRIM_OPS && !preserveCompatFns) {
        const j = findSubExpressionEnd(tokens, i);
        // If this is a broken expression or we cannot determine
        // sub-expression, we preserve the token instead.
        let r = t;
        if (j >= 0) {
          const subExpression = trimExpression(tokens.slice(i + 2, j));
          if (subExpression.length === 1 && isRange(subExpression[0])) {
            r = updateRangeToken(subExpression[0], TRIM_OPS[t.value], wb?.externalLinks, r1c1);
            i = j;
          }
        }
        outTokens.push(r);
      }
      // Remove Excel internal namespaces from functions.
      else if (!preservePrefixes) {
        t.value = t.value.replace(/^(?:_xlfn\.|_xludf\.|_xlws\.)+/i, '');
        outTokens.push(t);
      }
      else {
        outTokens.push(t);
      }
    }
    else if (isReference(t)) {
      if (!preservePrefixes && t.type === tokenTypes.REF_NAMED) {
        t.value = t.value.replace(/^(?:_xl[pn]m\.)/ig, '');
      }
      // normalize external references
      // xlsx reference syntax is different from Excel's runtime language syntax
      // in that external references are braced indexes into a links list, using
      // `[2]Sheet1!A1`, rather than including a name `[Workbook.xlsx]Sheet1!A1`
      if (t.value.includes('[')) {
        try {
          if (t.type === tokenTypes.REF_STRUCT) {
            const ref = parseStructRef(t.value);
            // if (ref.table && wb.tables?.length) {
            //   // TODO: omit the table prefix if current cell is within the table
            // }
            t.value = stringifyStructRefCtx(updateContext(ref, wb?.externalLinks));
          }
          else {
            updateRangeToken(t, null, wb?.externalLinks, r1c1);
          }
        }
        catch (err) {
          t.value = '#REF!';
        }
      }
      outTokens.push(t);
    }
    else {
      outTokens.push(t);
    }
  }
  return outTokens;
}

// External references (`[N]Sheet!Ref` or `[wb]Sheet!Ref`) always need
// normalization regardless of which preserve-* options are set, so this
// pattern is checked first and unconditionally.
const NEEDS_EXTREF = /(?:[^RC"]\[|^\[)/;
// XLSX-internal prefixes — only need handling when `preservePrefixes` is off.
const NEEDS_PREFIX = /_xl(?:fn|udf|ws|pm|nm)\./i;
// Compatibility-function patterns that get rewritten to operators —
// only need handling when `preserveCompatibilityFunctions` is off. The
// `\.:` / `:\.` patterns trigger because fx emits range-trim ranges with
// dot markers and we may need to canonicalize them.
const NEEDS_COMPATFN = /(?:\.:|:\.)|ANCHORARRAY|SINGLE|_TRO_(?:ALL|LEADING|TRAILING)/i;

export function normalizeFormula (
  formula: string, wb?: ConversionContextSubset | null,
): string {
  // quickly test if work is actually needed
  const needsWork =
    NEEDS_EXTREF.test(formula) ||
    (!wb?.preservePrefixes && NEEDS_PREFIX.test(formula)) ||
    (!wb?.preserveCompatibilityFunctions && NEEDS_COMPATFN.test(formula));
  if (!needsWork) {
    return formula;
  }
  const tokens = tokenize(formula.normalize());
  return stringifyTokens(normalizeFormulaTokens(tokens, wb));
}
