import {
  type ReferenceStruct,
  isFunction, isReference, parseA1Ref, parseStructRef, stringifyA1Ref,
  stringifyStructRef, tokenTypes, tokenize,
  type ReferenceA1,
} from '@borgar/fx';
import type { External } from '@jsfkit/types';

type Ref = ReferenceStruct | ReferenceA1;
type RefContext = string[];

function updateContext (ref: Ref, externalLinks: External[]): RefContext {
  const context: RefContext = [];
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
  return context;
}

export function normalizeFormula (formula: string, wb): string {
  // quickly test if work is actually needed
  if (!/_xl(?:fn|udf|ws|pm)\.|\[/i.test(formula)) {
    return formula;
  }
  const tokens = tokenize(formula.normalize(), { xlsx: true });
  let normalized = '';
  tokens.forEach(t => {
    if (isFunction(t)) {
      // remove certain namespaces from functions
      normalized += t.value.replace(/^(?:_xlfn\.|_xludf\.|_xlws\.)+/i, '');
      return;
    }
    else if (isReference(t)) {
      if (t.type === tokenTypes.REF_NAMED) {
        t.value = t.value.replace(/^(?:_xlpm\.)/ig, '');
      }
      // normalize external references
      // xlsx reference syntax is different from Excel's runtime language syntax
      // in that external references are braced indexes into a links list, using
      // `[2]Sheet1!A1`, rather than including a name `[Workbook.xlsx]Sheet1!A1`
      if (t.value.includes('[')) {
        let newValue: string;
        try {
          if (t.type === tokenTypes.REF_STRUCT) {
            const ref = parseStructRef(t.value, { xlsx: true });
            if (ref.table && wb.tables?.length) {
              // TODO: omit the table prefix if current cell is within the table
            }
            ref.context = updateContext(ref, wb.externalLinks);
            newValue = stringifyStructRef(ref);
          }
          else {
            const ref = parseA1Ref(t.value, { xlsx: true });
            ref.context = updateContext(ref, wb.externalLinks);
            newValue = stringifyA1Ref(ref);
          }
        }
        catch (err) {
          newValue = '#REF!';
        }
        normalized += newValue;
        return;
      }
    }
    normalized += t.value;
  });
  return normalized;
}
