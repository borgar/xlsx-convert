import type { Element } from '@borgar/simple-xml';
import type { PivotPageField } from '@jsfkit/types';
import { addProp } from '../../utils/addProp.ts';
import { numAttr, xstringAttr } from '../../utils/attr.ts';

export function parsePageFields (root: Element): PivotPageField[] {
  const pageFields: PivotPageField[] = [];
  for (const pf of root.querySelectorAll('pageFields > pageField')) {
    const pageField: PivotPageField = {
      fieldIndex: numAttr(pf, 'fld', 0),
    };
    addProp(pageField, 'selectedItem', numAttr(pf, 'item'));
    addProp(pageField, 'name', xstringAttr(pf, 'name'));
    addProp(pageField, 'caption', xstringAttr(pf, 'cap'));
    addProp(pageField, 'hierarchy', numAttr(pf, 'hier'));
    pageFields.push(pageField);
  }
  return pageFields;
}
