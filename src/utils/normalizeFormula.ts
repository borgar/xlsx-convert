import {
  isFunction, isReference, parseA1Ref, parseStructRef,
  tokenTypes, tokenize, parseR1C1Ref,
  type ReferenceStructXlsx,
  type ReferenceA1Xlsx,
  type Token,
  stringifyTokens,
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
type ConversionContextSubset = { externalLinks: ExternalSubset[] };

/**
 * Updates a reference:
 * - Translates from xlsx reference notation to context notation: [wb1]!A1 => wb!A1
 * - Handles rewriting external ref numbers to names: [1]!A1 => [wb.xlsx]!A1
 */
function updateContext (
  ref: ReferenceStructXlsx | ReferenceR1C1Xlsx | ReferenceA1Xlsx | ReferenceNameXlsx,
  externalLinks: ExternalSubset[],
): ReferenceStruct | ReferenceR1C1 | ReferenceA1 | ReferenceName {
  const context: string[] = [];
  if (ref.workbookName && isFinite(+ref.workbookName)) {
    const wbIndex = +ref.workbookName - 1;
    if (externalLinks[wbIndex]) {
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

export function normalizeFormulaTokens (tokens: Token[], wb: ConversionContextSubset, r1c1 = false): Token[] {
  tokens.forEach(t => {
    if (isFunction(t)) {
      // remove certain namespaces from functions
      t.value = t.value.replace(/^(?:_xlfn\.|_xludf\.|_xlws\.)+/i, '');
      return;
    }
    else if (isReference(t)) {
      if (t.type === tokenTypes.REF_NAMED) {
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
            t.value = stringifyStructRefCtx(updateContext(ref, wb.externalLinks));
          }
          else if (r1c1) {
            const ref = updateContext(parseR1C1Ref(t.value), wb.externalLinks);
            t.value = stringifyR1C1RefCtx(ref as ReferenceR1C1 | ReferenceName);
          }
          else {
            const updated = updateContext(parseA1Ref(t.value), wb.externalLinks);
            t.value = stringifyA1RefCtx(updated as ReferenceA1 | ReferenceName);
          }
        }
        catch (err) {
          t.value = '#REF!';
        }
        return;
      }
    }
  });
  return tokens;
}

export function normalizeFormula (formula: string, wb: ConversionContextSubset): string {
  // quickly test if work is actually needed
  if (!/_xl(?:fn|udf|ws|pm|nm)\.|(?:[^RC"]\[|^\[)/i.test(formula)) {
    return formula;
  }
  const tokens = tokenize(formula.normalize());
  return stringifyTokens(normalizeFormulaTokens(tokens, wb));
}
