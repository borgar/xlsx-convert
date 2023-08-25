import { isFunction, isReference, parseA1Ref, parseStructRef, stringifyA1Ref, stringifyStructRef, tokenTypes, tokenize } from '@borgar/fx';

function updateContext (ref, externalLinks) {
  const context = [];
  if (ref.workbookName) {
    const link = externalLinks[ref.workbookName - 1];
    context.push(link.filename);
  }
  if (ref.sheetName) {
    context.push(ref.sheetName);
  }
  return context;
}

export function normalizeFormula (formula, wb) {
  const tokens = tokenize(formula.normalize(), { xlsx: true });
  let normalized = '';
  tokens.forEach(t => {
    if (isFunction(t)) {
      // remove certain namespaces from functions
      normalized += t.value.replace(/^(?:_xlfn\.|_xludf\.|_xlws\.)+/i, '');
      return;
    }
    else if (isReference(t) && wb?.externalLinks) {
      // normalize external references
      // xlsx reference syntax is different from Excel's runtime language syntax
      // in that external references are braced indexes into a links list, using
      // `[2]Sheet1!A1`, rather than including a name `[Workbook.xlsx]Sheet1!A1`
      if (t.value.includes('[')) {
        let newValue;
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
        normalized += newValue;
        return;
      }
    }
    normalized += t.value;
  });
  return normalized;
}
